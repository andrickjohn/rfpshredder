// scripts/scrape-sam-direct.js
// Fixed: multi-result nav, SSL cert fix, ZIP extraction, dedup
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const https = require('https');
const http = require('http');
const JSZip = require('jszip');

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');
const TARGET_URL = process.env.TARGET_URL || '';
const KEYWORDS = process.env.TARGET_KEYWORDS
    ? process.env.TARGET_KEYWORDS.split(',')
    : ['section l', 'section m', 'schedule l', 'schedule m',
        'instructions to offerors', 'evaluation criteria'];
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
function send(data) { console.log(JSON.stringify(data)); }
function log(msg) { send({ type: 'log', message: msg }); }

function isPdf(buf) { return buf.length > 100 && buf.slice(0, 5).toString('ascii').startsWith('%PDF'); }
function isZip(buf) { return buf.length > 100 && buf.slice(0, 2).toString('ascii').startsWith('PK'); }

function downloadWithCookies(url, cookies, redirects = 0) {
    if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
    return new Promise((resolve, reject) => {
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, {
            headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0 Chrome/120', 'Referer': 'https://sam.gov/' },
            timeout: 30000,
            rejectUnauthorized: false  // FIX SSL cert issue
        }, (res) => {
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

async function extractPdfsFromZip(zipBuf) {
    const pdfs = [];
    try {
        const zip = await JSZip.loadAsync(zipBuf);
        for (const [name, file] of Object.entries(zip.files)) {
            if (file.dir) continue;
            if (name.toLowerCase().endsWith('.pdf') || name.toLowerCase().endsWith('.doc')) {
                const buf = await file.async('nodebuffer');
                if (buf.length > 1000) pdfs.push({ name, buffer: buf });
            }
        }
    } catch { }
    return pdfs;
}

async function checkKeywords(buf) {
    try {
        const parsed = await pdfParse(buf);
        const text = parsed.text.toLowerCase();
        if (text.length < 100) return [];
        return KEYWORDS.filter(kw => text.includes(kw));
    } catch { return []; }
}

async function processOpp(page, noticeId) {
    let found = 0;

    // Click attachment tabs
    for (const sel of ['[role="tab"]', 'a', 'button', '.tab-label', '[class*="tab"]']) {
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

    // Find links
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

    log(`   📎 ${links.length} download links`);

    if (links.length > 0) {
        const cookies = await page.cookies();
        for (const dl of links.slice(0, 10)) {
            log(`   📥 ${dl.text || dl.href.substring(0, 60)}`);
            try {
                const buf = await downloadWithCookies(dl.href, cookies);
                if (buf.length < 1000) { log(`      ⏭️ Too small`); continue; }

                if (isZip(buf)) {
                    log(`      📦 ZIP (${(buf.length / 1024).toFixed(0)}KB) — extracting...`);
                    const pdfs = await extractPdfsFromZip(buf);
                    log(`      📄 ${pdfs.length} files inside`);
                    for (const pdf of pdfs) {
                        const matched = await checkKeywords(pdf.buffer);
                        if (matched.length > 0) {
                            const fname = `SAM_Direct_${noticeId || Date.now()}_${found}.pdf`;
                            fs.writeFileSync(path.join(OUTPUT_DIR, fname), pdf.buffer);
                            log(`      ✅ MATCH! "${matched.join('", "')}" → ${fname}`);
                            send({ type: 'result', match: { oppTitle: 'Direct', solicitation: noticeId || '', link: dl.href, filename: fname } });
                            found++;
                        } else {
                            log(`      ❌ ${pdf.name}: no keywords`);
                        }
                    }
                } else if (isPdf(buf)) {
                    log(`      📄 PDF (${(buf.length / 1024).toFixed(0)}KB)`);
                    const matched = await checkKeywords(buf);
                    if (matched.length > 0) {
                        const fname = `SAM_Direct_${noticeId || Date.now()}_${found}.pdf`;
                        fs.writeFileSync(path.join(OUTPUT_DIR, fname), buf);
                        log(`      ✅ MATCH! "${matched.join('", "')}" → ${fname}`);
                        send({ type: 'result', match: { oppTitle: 'Direct', solicitation: noticeId || '', link: dl.href, filename: fname } });
                        found++;
                    } else {
                        log(`      ❌ No keywords`);
                    }
                } else {
                    const hdr = buf.slice(0, 5).toString('ascii');
                    log(`      ⏭️ Not PDF/ZIP (header: "${hdr}")`);
                }
            } catch (err) { log(`      ⚠️ ${err.message}`); }
        }
    }

    return found;
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
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    let totalFound = 0;

    try {
        log(`📄 Navigating...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await delay(5000);

        if (isSearch) {
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

            log(`📋 ${oppLinks.length} opportunities`);
            if (!oppLinks.length) { log('❌ No results'); await browser.close(); return; }

            // Navigate ALL results (up to 10)
            for (let i = 0; i < Math.min(oppLinks.length, 10); i++) {
                if (totalFound >= 5) break;
                const oppUrl = oppLinks[i];
                const match = oppUrl.match(/\/opp\/([^/]+)/);
                const noticeId = match ? match[1] : null;

                if (noticeId && seenList.includes(noticeId)) {
                    log(`⏭️ [${i + 1}] Already seen`);
                    continue;
                }

                log(`\n🔎 [${i + 1}/${oppLinks.length}] ${oppUrl.substring(oppUrl.indexOf('/opp/'))}`);

                try { await page.goto(oppUrl, { waitUntil: 'networkidle2', timeout: 60000 }); }
                catch { log('   ⚠️ Timeout'); continue; }
                await delay(3000);

                const found = await processOpp(page, noticeId);
                totalFound += found;
                if (noticeId) markSeen(noticeId);
            }
        } else {
            // Direct URL
            const match = url.match(/\/opp\/([^/]+)/);
            const noticeId = match ? match[1] : null;
            await delay(3000);
            totalFound = await processOpp(page, noticeId);
            if (noticeId) markSeen(noticeId);
        }

        log(`\n🏁 Done. ${totalFound} matching PDFs.`);
    } catch (err) { log(`❌ ${err.message}`); }

    await browser.close();
}

directLookup();
