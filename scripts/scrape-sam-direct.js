// scripts/scrape-sam-direct.js
// Fixed: navigates through MULTIPLE search results (not just first),
// uses cookie-based downloads, validates PDF magic bytes, dedup
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');
const TARGET_URL = process.env.TARGET_URL || '';
const KEYWORDS = process.env.TARGET_KEYWORDS
    ? process.env.TARGET_KEYWORDS.split(',')
    : ['section l', 'section m', 'schedule l', 'schedule m',
        'instructions to offerors', 'evaluation criteria'];
const SEEN_FILE = path.join(OUTPUT_DIR, 'seen_solicitations.json');

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function send(data) { console.log(JSON.stringify(data)); }
function log(msg) { send({ type: 'log', message: msg }); }

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

function isPdfBuffer(buf) {
    if (buf.length < 100) return false;
    return buf.slice(0, 5).toString('ascii').startsWith('%PDF');
}

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

async function processPage(page, noticeId) {
    const files = [];

    // Try clicking Attachments tab (multiple strategies)
    const strategies = [
        `document.querySelectorAll('[role="tab"]').forEach(t => { if (t.textContent.toLowerCase().includes('attach')) t.click(); })`,
        `document.querySelectorAll('a, button').forEach(el => { if (el.textContent.toLowerCase().includes('attachment')) el.click(); })`,
        `document.querySelectorAll('.tab-label, .mat-tab-label').forEach(t => { if (t.textContent.toLowerCase().includes('attach')) t.click(); })`,
    ];
    for (const s of strategies) {
        try { await page.evaluate(s); await delay(1500); } catch { }
    }
    await delay(3000);

    // Find download links
    const links = await page.evaluate(() => {
        const found = [];
        const seen = new Set();
        document.querySelectorAll('a').forEach(a => {
            const href = a.href || '';
            if (seen.has(href) || href.length < 10) return;
            seen.add(href);
            const lh = href.toLowerCase();
            const lt = (a.textContent || '').toLowerCase().trim();
            if (lh.includes('/download') || lh.includes('api.sam.gov') || lh.includes('/resource/') ||
                lh.endsWith('.pdf') || lh.endsWith('.doc') || lh.endsWith('.docx') ||
                lt.includes('.pdf') || lt.includes('download') ||
                (lt.includes('attachment') && href.startsWith('http'))) {
                found.push({ href, text: (a.textContent || '').trim().substring(0, 80) });
            }
        });
        return found;
    });

    log(`   📎 ${links.length} download links`);

    // Download with cookies
    if (links.length > 0) {
        const cookies = await page.cookies();
        for (const dl of links.slice(0, 10)) {
            const ext = (dl.text || dl.href).split('.').pop()?.toLowerCase() || '';
            if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif'].includes(ext)) continue;

            log(`   📥 ${dl.text || dl.href.substring(0, 60)}`);
            try {
                const buf = await downloadWithCookies(dl.href, cookies);
                if (buf.length > 5000 && isPdfBuffer(buf)) {
                    files.push({ buffer: buf, name: dl.text || 'download.pdf' });
                    log(`      ✓ ${(buf.length / 1024).toFixed(0)}KB PDF`);
                } else if (buf.length > 5000) {
                    log(`      ⏭️ Not PDF (${(buf.length / 1024).toFixed(0)}KB)`);
                } else {
                    log(`      ⏭️ Too small`);
                }
            } catch (err) { log(`      ⚠️ ${err.message}`); }
        }
    }

    return files;
}

async function directLookup() {
    loadSeen();
    if (!TARGET_URL) { log('❌ No URL'); return; }

    let url = TARGET_URL;
    const isSearch = !url.startsWith('http') || url.includes('/search/') || url.includes('index=opp');
    if (!url.startsWith('http')) {
        url = `https://sam.gov/search/?index=opp&q=${encodeURIComponent(url)}&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true`;
        log(`🔍 Searching: "${TARGET_URL}"`);
    }

    log(`🚀 Launching browser...`);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    let totalFound = 0;

    try {
        log(`📄 Navigating...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await delay(5000);

        if (isSearch) {
            // Collect ALL opportunity links from search results
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

            log(`📋 ${oppLinks.length} opportunities found on search page`);

            if (oppLinks.length === 0) {
                log('❌ No results found');
                await browser.close();
                return;
            }

            // Navigate through MULTIPLE results (up to 10!)
            for (let i = 0; i < Math.min(oppLinks.length, 10); i++) {
                if (totalFound >= 5) break;

                const oppUrl = oppLinks[i];
                const match = oppUrl.match(/\/opp\/([^/]+)/);
                const noticeId = match ? match[1] : null;

                if (noticeId && seenList.includes(noticeId)) {
                    log(`⏭️ [${i + 1}/${oppLinks.length}] Already seen`);
                    continue;
                }

                log(`\n🔎 [${i + 1}/${oppLinks.length}] ${oppUrl.substring(oppUrl.indexOf('/opp/'))}`);

                try {
                    await page.goto(oppUrl, { waitUntil: 'networkidle2', timeout: 60000 });
                    await delay(3000);
                } catch { log('   ⚠️ Page timeout'); continue; }

                const files = await processPage(page, noticeId);

                for (const file of files) {
                    if (totalFound >= 5) break;
                    let text = '';
                    try {
                        const parsed = await pdfParse(file.buffer);
                        text = parsed.text.toLowerCase();
                    } catch {
                        if (isPdfBuffer(file.buffer)) {
                            const fname = `SAM_Direct_${noticeId || Date.now()}_protected.pdf`;
                            fs.writeFileSync(path.join(OUTPUT_DIR, fname), file.buffer);
                            log(`   💾 Protected PDF: ${fname}`);
                            send({ type: 'result', match: { oppTitle: 'Direct', solicitation: noticeId || '', link: '', filename: fname } });
                            totalFound++;
                        }
                        continue;
                    }

                    if (text.length < 100) { log(`   ⏭️ Image/scanned`); continue; }

                    const matched = KEYWORDS.filter(kw => text.includes(kw));
                    if (matched.length > 0) {
                        const fname = `SAM_Direct_${noticeId || Date.now()}_${totalFound}.pdf`;
                        fs.writeFileSync(path.join(OUTPUT_DIR, fname), file.buffer);
                        log(`   ✅ MATCH! "${matched.join('", "')}" → ${fname}`);
                        send({ type: 'result', match: { oppTitle: 'Direct', solicitation: noticeId || '', link: '', filename: fname } });
                        totalFound++;
                    } else {
                        log(`   ❌ No keywords (${(text.length / 1000).toFixed(0)}k chars)`);
                    }
                }

                if (noticeId) markSeen(noticeId);
            }
        } else {
            // Direct URL to a specific opportunity
            const match = url.match(/\/opp\/([^/]+)/);
            const noticeId = match ? match[1] : null;
            const files = await processPage(page, noticeId);

            for (const file of files) {
                let text = '';
                try {
                    const parsed = await pdfParse(file.buffer);
                    text = parsed.text.toLowerCase();
                } catch { continue; }

                const matched = KEYWORDS.filter(kw => text.includes(kw));
                if (matched.length > 0) {
                    const fname = `SAM_Direct_${noticeId || Date.now()}_${totalFound}.pdf`;
                    fs.writeFileSync(path.join(OUTPUT_DIR, fname), file.buffer);
                    log(`✅ MATCH! → ${fname}`);
                    send({ type: 'result', match: { oppTitle: 'Direct', solicitation: noticeId || '', link: '', filename: fname } });
                    totalFound++;
                }
            }
            if (noticeId) markSeen(noticeId);
        }

        log(`\n🏁 Done. ${totalFound} matching PDFs found.`);
    } catch (err) { log(`❌ ${err.message}`); }

    await browser.close();
}

directLookup();
