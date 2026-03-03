// scripts/scrape-sam-ui.js
// Fixed: page.off() instead of removeListener, multi-opp navigation,
// smarter tab clicking, cookie-based downloads, dedup across runs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');
const NAICS_CODES = process.env.TARGET_NAICS
    ? process.env.TARGET_NAICS.split(',')
    : ['541511', '541512', '541519', '511210', '236220'];
const KEYWORDS = process.env.TARGET_KEYWORDS
    ? process.env.TARGET_KEYWORDS.split(',')
    : ['section l', 'section m', 'schedule l', 'schedule m',
        'instructions to offerors', 'evaluation criteria',
        'evaluation factors', 'proposal preparation',
        'proposal instructions', 'technical approach', 'past performance'];

const SEEN_FILE = path.join(OUTPUT_DIR, 'seen_solicitations.json');
let seenList = [];

function loadSeen() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    try { seenList = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { }
}
function markSeen(id) {
    if (!id || seenList.includes(id)) return;
    seenList.push(id);
    fs.writeFileSync(SEEN_FILE, JSON.stringify(seenList, null, 2));
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadWithCookies(url, cookies, redirects = 0) {
    if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, {
            headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0 Chrome/120', 'Referer': 'https://sam.gov/' },
            timeout: 30000
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let loc = res.headers.location;
                if (loc.startsWith('/')) loc = `https://sam.gov${loc}`;
                downloadWithCookies(loc, cookies, redirects + 1).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// Check if buffer is actually a PDF (not HTML error page)
function isPdfBuffer(buf) {
    if (buf.length < 100) return false;
    const header = buf.slice(0, 10).toString('ascii');
    return header.startsWith('%PDF');
}

async function processOpportunityPage(page, noticeId) {
    const capturedFiles = [];

    // Listen for file responses
    const handler = async (response) => {
        try {
            const ct = response.headers()['content-type'] || '';
            const cd = response.headers()['content-disposition'] || '';
            if (ct.includes('pdf') || ct.includes('octet-stream') || cd.includes('attachment')) {
                const buf = await response.buffer();
                if (buf.length > 5000 && isPdfBuffer(buf)) {
                    const name = cd.split('filename=')[1]?.replace(/"/g, '').trim() || `file_${capturedFiles.length}.pdf`;
                    capturedFiles.push({ buffer: buf, name });
                    console.log(`[UI] 📡 Intercepted: ${name} (${(buf.length / 1024).toFixed(0)}KB)`);
                }
            }
        } catch { }
    };
    page.on('response', handler);

    try {
        await delay(3000);

        // Try multiple tab-clicking strategies
        const tabStrategies = [
            // Strategy 1: Angular material tabs
            `document.querySelectorAll('[role="tab"]').forEach(t => { if (t.textContent.toLowerCase().includes('attach')) t.click(); })`,
            // Strategy 2: Regular links/buttons with attachment text
            `document.querySelectorAll('a, button').forEach(el => { if (el.textContent.toLowerCase().includes('attachment')) el.click(); })`,
            // Strategy 3: SAM.gov specific class
            `document.querySelectorAll('.tab-label, .mat-tab-label').forEach(t => { if (t.textContent.toLowerCase().includes('attach')) t.click(); })`,
            // Strategy 4: Click anything with "document" in it
            `document.querySelectorAll('a, button, [role="tab"]').forEach(el => { if (el.textContent.toLowerCase().includes('document')) el.click(); })`,
        ];

        for (const strategy of tabStrategies) {
            try {
                await page.evaluate(strategy);
                await delay(2000);
            } catch { }
        }

        // Wait for any lazy-loaded content
        await delay(3000);

        // Find all download-like links using broad selectors
        const downloadLinks = await page.evaluate(() => {
            const found = [];
            const seen = new Set();
            document.querySelectorAll('a').forEach(a => {
                const href = a.href || '';
                if (seen.has(href) || href.length < 10) return;
                seen.add(href);
                const text = (a.textContent || '').trim();
                const lhref = href.toLowerCase();
                const ltext = text.toLowerCase();
                if (
                    lhref.includes('/download') || lhref.includes('api.sam.gov') ||
                    lhref.includes('/resource/') || lhref.endsWith('.pdf') ||
                    lhref.endsWith('.doc') || lhref.endsWith('.docx') ||
                    ltext.includes('.pdf') || ltext.includes('download') ||
                    (ltext.includes('attachment') && href.startsWith('http'))
                ) {
                    found.push({ href, text: text.substring(0, 80) });
                }
            });
            return found;
        });

        console.log(`[UI] 📎 DOM links: ${downloadLinks.length} | Intercepted: ${capturedFiles.length}`);

        // Try downloading via cookies (more reliable than clicking)
        if (downloadLinks.length > 0) {
            const cookies = await page.cookies();
            for (const dl of downloadLinks.slice(0, 10)) {
                const ext = (dl.text || dl.href).split('.').pop()?.toLowerCase() || '';
                if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif'].includes(ext)) continue;

                console.log(`[UI] 📥 ${dl.text || dl.href.substring(0, 60)}`);
                try {
                    const buf = await downloadWithCookies(dl.href, cookies);
                    if (buf.length > 5000 && isPdfBuffer(buf)) {
                        capturedFiles.push({ buffer: buf, name: dl.text || 'download.pdf' });
                        console.log(`[UI]    ✓ ${(buf.length / 1024).toFixed(0)}KB PDF`);
                    } else if (buf.length > 5000) {
                        const hdr = buf.slice(0, 5).toString('ascii');
                        console.log(`[UI]    ⏭️ Not PDF (header: "${hdr}", ${(buf.length / 1024).toFixed(0)}KB)`);
                    } else {
                        console.log(`[UI]    ⏭️ Too small (${buf.length} bytes)`);
                    }
                } catch (err) {
                    console.log(`[UI]    ⚠️ ${err.message}`);
                }
            }
        }

    } finally {
        // Fixed: use page.off() not page.removeListener()
        page.off('response', handler);
    }

    return capturedFiles;
}

async function scrapeSamUI() {
    loadSeen();
    console.log(`[UI] Seen: ${seenList.length} | NAICS: ${NAICS_CODES.length} | Keywords: ${KEYWORDS.length}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    let totalDownloads = 0;

    for (const naics of NAICS_CODES) {
        if (totalDownloads >= 5) break;

        console.log(`\n[UI] 📡 NAICS ${naics}...`);
        const searchUrl = `https://sam.gov/search/?index=opp&page=1&pageSize=25&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5Bnaics%5D%5B0%5D%5Bkey%5D=${naics}&sfm%5Bnaics%5D%5B0%5D%5Bvalue%5D=${naics}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch { console.log(`[UI] ⚠️ Search page timeout`); continue; }
        await delay(5000);

        const oppLinks = await page.evaluate(() => {
            const links = [];
            const seen = new Set();
            document.querySelectorAll('a').forEach(a => {
                if (a.href && a.href.includes('/opp/') && a.href.includes('/view') && !seen.has(a.href)) {
                    seen.add(a.href);
                    links.push(a.href);
                }
            });
            return links;
        });

        console.log(`[UI] Found ${oppLinks.length} listings`);
        if (oppLinks.length === 0) continue;

        // Navigate through MULTIPLE opportunities (not just first!)
        for (const oppUrl of oppLinks.slice(0, 10)) {
            if (totalDownloads >= 5) break;

            const match = oppUrl.match(/\/opp\/([^/]+)/);
            const noticeId = match ? match[1] : null;
            if (noticeId && seenList.includes(noticeId)) {
                continue; // Skip already seen
            }

            console.log(`\n[UI] 🔎 ${oppUrl.substring(oppUrl.indexOf('/opp/'))}`);

            try {
                await page.goto(oppUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            } catch { console.log(`[UI] ⚠️ Page timeout`); continue; }

            const files = await processOpportunityPage(page, noticeId);

            // Check ALL captured PDFs for keywords
            for (const file of files) {
                if (totalDownloads >= 5) break;
                let text = '';
                try {
                    const parsed = await pdfParse(file.buffer);
                    text = parsed.text.toLowerCase();
                } catch {
                    // Save anyway for manual review if it's a real PDF
                    if (isPdfBuffer(file.buffer)) {
                        const name = `SAM_UI_${noticeId || Date.now()}_protected.pdf`;
                        fs.writeFileSync(path.join(OUTPUT_DIR, name), file.buffer);
                        console.log(`[UI] 💾 Protected PDF saved: ${name}`);
                        totalDownloads++;
                    }
                    continue;
                }

                if (text.length < 100) { console.log(`[UI] ⏭️ Image/scanned PDF`); continue; }

                const matched = KEYWORDS.filter(kw => text.includes(kw));
                if (matched.length > 0) {
                    const name = `SAM_UI_${noticeId || Date.now()}_${totalDownloads}.pdf`;
                    fs.writeFileSync(path.join(OUTPUT_DIR, name), file.buffer);
                    console.log(`[UI] ✅ MATCH! "${matched.join('", "')}" → ${name}`);
                    totalDownloads++;
                } else {
                    console.log(`[UI] ❌ No keywords (${(text.length / 1000).toFixed(0)}k chars)`);
                }
            }

            if (noticeId) markSeen(noticeId);
        }
    }

    await browser.close();
    console.log(totalDownloads > 0
        ? `\n[UI] 🎉 Done! ${totalDownloads} PDFs → ${OUTPUT_DIR}`
        : `\n[UI] ⚠️ No matches. Try different NAICS/keywords.`);
}

scrapeSamUI();
