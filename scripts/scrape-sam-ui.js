// scripts/scrape-sam-ui.js
// Fixed: SSL cert verification, ZIP extraction, smarter navigation
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const https = require('https');
const http = require('http');
const JSZip = require('jszip');

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

// Download with cookies — FIXED: rejectUnauthorized: false for SAM.gov SSL
function downloadWithCookies(url, cookies, redirects = 0) {
    if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const mod = url.startsWith('https') ? https : http;
        const opts = {
            headers: {
                'Cookie': cookieStr,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://sam.gov/'
            },
            timeout: 30000,
            rejectUnauthorized: false  // FIX: SAM.gov certs cause "unable to verify" errors
        };
        const req = mod.get(url, opts, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let loc = res.headers.location;
                if (loc.startsWith('/')) loc = new URL(url).origin + loc;
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

function isPdf(buf) { return buf.length > 100 && buf.slice(0, 5).toString('ascii').startsWith('%PDF'); }
function isZip(buf) { return buf.length > 100 && buf.slice(0, 2).toString('ascii').startsWith('PK'); }

async function extractPdfsFromZip(zipBuf) {
    const pdfs = [];
    try {
        const zip = await JSZip.loadAsync(zipBuf);
        for (const [name, file] of Object.entries(zip.files)) {
            if (file.dir) continue;
            const lower = name.toLowerCase();
            if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx')) {
                const buf = await file.async('nodebuffer');
                if (buf.length > 1000) pdfs.push({ name, buffer: buf });
            }
        }
    } catch { }
    return pdfs;
}

function detectSectionLMFromText(text) {
    if (text.length < 100) return { match: false, confidence: 0, patterns: [] };
    const norm = text.replace(/\s+/g, ' ');
    const lSignals = [
        ['section l', 'Section L'], ['part l', 'Part L'], ['l. instructions', 'L. Instructions'],
        ['instructions to offerors', 'Instructions to Offerors'], ['instructions to quoters', 'Instructions to Quoters'],
        ['proposal preparation instructions', 'Proposal Prep Instructions'], ['proposal instructions', 'Proposal Instructions'],
    ];
    const mSignals = [
        ['section m', 'Section M'], ['part m', 'Part M'], ['m. evaluation', 'M. Evaluation'],
        ['evaluation criteria', 'Evaluation Criteria'], ['evaluation factors', 'Evaluation Factors'],
        ['evaluation factors for award', 'Eval Factors for Award'], ['basis for award', 'Basis for Award'],
    ];
    const matchedL = [], matchedM = [];
    for (const [pat, label] of lSignals) { if (norm.includes(pat)) matchedL.push(label); }
    for (const [pat, label] of mSignals) { if (norm.includes(pat)) matchedM.push(label); }
    const match = matchedL.length > 0 && matchedM.length > 0;
    let confidence = 0;
    if (match) {
        confidence = 85;
        if (matchedL.length >= 2) confidence += 5;
        if (matchedM.length >= 2) confidence += 5;
        if (norm.includes('instructions to offerors') && norm.includes('evaluation factors for award')) confidence = Math.max(confidence, 95);
        confidence = Math.min(confidence, 100);
    }
    const patterns = [];
    if (matchedL.length > 0) patterns.push(`L: ${matchedL.join(', ')}`);
    if (matchedM.length > 0) patterns.push(`M: ${matchedM.join(', ')}`);
    return { match, confidence, patterns };
}

async function detectSectionLM(buf) {
    try {
        const parsed = await pdfParse(buf);
        const text = parsed.text.toLowerCase();
        return detectSectionLMFromText(text);
    } catch { return { match: false, confidence: 0, patterns: [] }; }
}

function scoreAttachment(name, solicitationNumber) {
    const lower = (name || '').toLowerCase();
    let score = 0;
    if (solicitationNumber && lower.includes(solicitationNumber.toLowerCase())) score += 3;
    if (lower.includes('rfp')) score += 2;
    if (lower.includes('solicitation')) score += 2;
    if (lower.includes('final') || lower.includes('conformed')) score += 1;
    if (lower.includes('attachment')) score -= 2;
    if (lower.includes('amendment')) score -= 3;
    if (lower.includes('pricing')) score -= 2;
    if (lower.includes('q&a') || lower.includes('q & a') || lower.includes('questions and answers')) score -= 2;
    if (lower.includes('template')) score -= 2;
    return score;
}

async function processBuffers(buffers, noticeId) {
    const results = [];
    for (const item of buffers) {
        if (isZip(item.buffer)) {
            console.log(`[UI]    📦 ZIP: ${item.name} — extracting...`);
            const pdfs = await extractPdfsFromZip(item.buffer);
            console.log(`[UI]    📄 ${pdfs.length} files inside`);
            for (const pdf of pdfs) {
                const detection = await detectSectionLM(pdf.buffer);
                if (detection.match) {
                    results.push({ buffer: pdf.buffer, name: pdf.name, matched: detection.patterns, confidence: detection.confidence });
                } else {
                    console.log(`[UI]    ❌ No L+M in ${pdf.name} (${detection.confidence}%)`);
                }
            }
        } else if (isPdf(item.buffer)) {
            const detection = await detectSectionLM(item.buffer);
            if (detection.match) {
                results.push({ buffer: item.buffer, name: item.name, matched: detection.patterns, confidence: detection.confidence });
            } else {
                console.log(`[UI]    ❌ No L+M in ${item.name} (${detection.confidence}%)`);
            }
        } else {
            const hdr = item.buffer.slice(0, 5).toString('ascii');
            console.log(`[UI]    ⏭️ ${item.name}: not PDF/ZIP (header: "${hdr}")`);
        }
    }
    return results;
}

async function scrapeSamUI() {
    loadSeen();
    console.log(`[UI] Seen: ${seenList.length} | NAICS: ${NAICS_CODES.length} | Keywords: ${KEYWORDS.length}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
            '--ignore-certificate-errors']  // Fix SSL issues in browser too
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    let totalDownloads = 0;

    for (const naics of NAICS_CODES) {
        if (totalDownloads >= 5) break;
        console.log(`\n[UI] 📡 NAICS ${naics}...`);

        const searchUrl = `https://sam.gov/search/?index=opp&page=3&pageSize=25&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5Bnaics%5D%5B0%5D%5Bkey%5D=${naics}&sfm%5Bnaics%5D%5B0%5D%5Bvalue%5D=${naics}`;

        try { await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 }); }
        catch { console.log(`[UI] ⚠️ Search timeout`); continue; }
        await delay(5000);

        const oppLinks = await page.evaluate(() => {
            const found = [];
            const seen = new Set();
            document.querySelectorAll('a').forEach(a => {
                if (a.href && a.href.includes('/opp/') && a.href.includes('/view') && !seen.has(a.href)) {
                    seen.add(a.href); found.push(a.href);
                }
            });
            return found;
        });

        console.log(`[UI] ${oppLinks.length} listings`);

        for (const oppUrl of oppLinks.slice(0, 25)) {
            if (totalDownloads >= 5) break;
            const match = oppUrl.match(/\/opp\/([^/]+)/);
            const noticeId = match ? match[1] : null;
            if (noticeId && seenList.includes(noticeId)) continue;

            console.log(`\n[UI] 🔎 ${oppUrl.substring(oppUrl.indexOf('/opp/'))}`);

            try { await page.goto(oppUrl, { waitUntil: 'networkidle2', timeout: 60000 }); }
            catch { console.log(`[UI] ⚠️ Timeout`); continue; }
            await delay(4000);

            // Click attachment tabs (multiple strategies)
            for (const sel of [
                '[role="tab"]', 'a', 'button', '.tab-label', '.mat-tab-label', '[class*="tab"]'
            ]) {
                try {
                    await page.evaluate((s) => {
                        document.querySelectorAll(s).forEach(el => {
                            const t = (el.textContent || '').toLowerCase();
                            if (t.includes('attachment') || t.includes('document')) el.click();
                        });
                    }, sel);
                } catch { }
            }
            await delay(4000);

            // Find download links
            const links = await page.evaluate(() => {
                const found = [];
                const seen = new Set();
                document.querySelectorAll('a').forEach(a => {
                    const href = a.href || '';
                    if (seen.has(href) || href.length < 10) return;
                    seen.add(href);
                    const lh = href.toLowerCase();
                    const lt = (a.textContent || '').toLowerCase();
                    if (lh.includes('/download') || lh.includes('api.sam.gov') || lh.includes('/resource/') ||
                        lh.endsWith('.pdf') || lh.endsWith('.doc') || lh.endsWith('.zip') ||
                        lt.includes('.pdf') || lt.includes('download') || lt.includes('attachment')) {
                        found.push({ href, text: (a.textContent || '').trim().substring(0, 80) });
                    }
                });
                return found;
            });

            console.log(`[UI] 📎 ${links.length} download links`);

            // Score links by filename/text and take top 2
            const solNum = ''; // UI mode doesn't have solicitationNumber readily
            const scored = links.map(dl => ({
                ...dl,
                score: scoreAttachment(dl.text || dl.href, solNum)
            }));
            scored.sort((a, b) => b.score - a.score);
            const topLinks = scored.length <= 6 ? scored : scored.slice(0, 6);
            console.log(`[UI] 📊 Scored ${scored.length} links → downloading ${topLinks.length}${scored.length <= 6 ? ' (all)' : ' (top 6)'}`);

            const downloadedBuffers = [];
            let hadDownloadError = false;
            if (topLinks.length > 0) {
                const cookies = await page.cookies();
                for (const dl of topLinks) {
                    console.log(`[UI]    📥 [score:${dl.score}] ${dl.text || dl.href.substring(0, 60)}`);
                    try {
                        const buf = await downloadWithCookies(dl.href, cookies);
                        if (buf.length > 1000) {
                            downloadedBuffers.push({ buffer: buf, name: dl.text || 'file' });
                            console.log(`[UI]    ✓ ${(buf.length / 1024).toFixed(0)}KB`);
                        }
                    } catch (err) {
                        hadDownloadError = true;
                        console.log(`[UI]    ⚠️ ${err.message}`);
                        console.log(`[UI]    🔄 Retryable: network error`);
                    }
                }
            }

            // Process all downloads (handles ZIP + PDF)
            const matches = await processBuffers(downloadedBuffers, noticeId);
            for (const m of matches) {
                if (totalDownloads >= 5) break;
                const fname = `SAM_UI_${noticeId || Date.now()}_${totalDownloads}.pdf`;
                fs.writeFileSync(path.join(OUTPUT_DIR, fname), m.buffer);
                console.log(`[UI] ✅ MATCH [${m.confidence || 0}%] ${m.matched.join(' + ')} → ${fname}`);
                totalDownloads++;
            }

            // Smart seen-marking: skip if download errors occurred
            if (noticeId) {
                if (hadDownloadError) {
                    console.log(`[UI] ⏸️ NOT marking ${noticeId} as seen (retryable errors)`);
                } else {
                    markSeen(noticeId);
                }
            }
        }
    }

    await browser.close();
    console.log(totalDownloads > 0
        ? `\n[UI] 🎉 ${totalDownloads} PDFs → ${OUTPUT_DIR}`
        : `\n[UI] ⚠️ No matches. Try different NAICS/keywords.`);
}

scrapeSamUI();
