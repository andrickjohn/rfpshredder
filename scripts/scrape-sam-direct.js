// scripts/scrape-sam-direct.js
// Direct lookup: navigate to a specific SAM.gov URL, find and download all PDFs
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
    : ['section l', 'section m', 'schedule l', 'schedule m'];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function send(data) { console.log(JSON.stringify(data)); }
function log(msg) { send({ type: 'log', message: msg }); }

function downloadWithCookies(url, cookies) {
    return new Promise((resolve, reject) => {
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, {
            headers: {
                'Cookie': cookieHeader,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
                'Accept': '*/*',
                'Referer': 'https://sam.gov/'
            },
            timeout: 30000
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                downloadWithCookies(res.headers.location, cookies).then(resolve).catch(reject);
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

async function directLookup() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (!TARGET_URL) { log('❌ No URL provided'); return; }

    let url = TARGET_URL;
    if (!url.startsWith('http')) {
        url = `https://sam.gov/search/?index=opp&q=${encodeURIComponent(url)}&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true`;
        log(`🔍 Searching: "${TARGET_URL}"`);
    }

    log(`🚀 Launching browser...`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture PDF files from network
    const capturedFiles = [];
    page.on('response', async (response) => {
        try {
            const rUrl = response.url();
            const ct = response.headers()['content-type'] || '';
            const cd = response.headers()['content-disposition'] || '';
            if (ct.includes('pdf') || cd.includes('attachment') || cd.includes('.pdf') || rUrl.includes('/download')) {
                const buffer = await response.buffer();
                if (buffer.length > 5000) {
                    const name = cd.split('filename=')[1]?.replace(/"/g, '').trim() || `file_${capturedFiles.length}.pdf`;
                    capturedFiles.push({ buffer, name, url: rUrl });
                    log(`📡 Captured: ${name} (${(buffer.length / 1024).toFixed(0)}KB)`);
                }
            }
        } catch { }
    });

    try {
        log(`📄 Navigating...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await delay(5000);

        // If search page, click first result
        if (url.includes('/search/') || url.includes('index=opp')) {
            const firstLink = await page.evaluate(() => {
                for (const a of document.querySelectorAll('a[href*="/opp/"]')) {
                    if (a.href.includes('/view')) return a.href;
                }
                return null;
            });

            if (firstLink) {
                log(`📌 First result: ${firstLink.substring(firstLink.indexOf('/opp/'))}`);
                await page.goto(firstLink, { waitUntil: 'networkidle2', timeout: 60000 });
                await delay(5000);
            } else {
                log(`❌ No results found`);
                await browser.close();
                return;
            }
        }

        // Click Attachments tab
        try {
            const clicked = await page.evaluate(() => {
                for (const el of document.querySelectorAll('a, button, [role="tab"], [class*="tab"]')) {
                    const text = (el.textContent || '').toLowerCase();
                    if (text.includes('attachment') || text.includes('document')) { el.click(); return text.trim(); }
                }
                return null;
            });
            if (clicked) { log(`📂 Tab: "${clicked}"`); await delay(4000); }
        } catch { }

        // Find download links
        const downloadLinks = await page.evaluate(() => {
            const links = [];
            document.querySelectorAll('a').forEach(a => {
                const href = a.href || '';
                const text = (a.textContent || '').trim();
                if (href.includes('/download') || href.includes('api.sam.gov') ||
                    href.includes('/resource/') || href.toLowerCase().endsWith('.pdf') ||
                    href.toLowerCase().endsWith('.doc') || text.toLowerCase().includes('.pdf')) {
                    links.push({ href, text: text.substring(0, 80) });
                }
            });
            return links;
        });

        log(`📎 Links: ${downloadLinks.length} | Intercepted: ${capturedFiles.length}`);

        // Click download links to trigger interception
        for (const dl of downloadLinks.slice(0, 8)) {
            log(`📥 Clicking: ${dl.text || dl.href.substring(0, 60)}`);
            try {
                await page.goto(dl.href, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => null);
                await delay(3000);
                await page.goBack({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => null);
                await delay(2000);
            } catch { }
        }

        // Fallback: download with cookies
        if (capturedFiles.length === 0 && downloadLinks.length > 0) {
            log(`⬇️ Trying cookie-based download...`);
            const cookies = await page.cookies();
            for (const dl of downloadLinks.slice(0, 5)) {
                try {
                    const buffer = await downloadWithCookies(dl.href, cookies);
                    if (buffer.length > 5000) {
                        capturedFiles.push({ buffer, name: dl.text || 'download.pdf', url: dl.href });
                        log(`📡 Downloaded: ${dl.text} (${(buffer.length / 1024).toFixed(0)}KB)`);
                    }
                } catch (err) { log(`⚠️ ${err.message}`); }
            }
        }

        // Check ALL captured files
        let found = 0;
        for (const file of capturedFiles) {
            let text = '';
            try {
                const parsed = await pdfParse(file.buffer);
                text = parsed.text.toLowerCase();
            } catch { log(`❌ ${file.name}: not readable`); continue; }

            if (text.length < 200) { log(`⏭️ ${file.name}: scanned/image`); continue; }

            const matched = KEYWORDS.filter(kw => text.includes(kw));
            if (matched.length > 0) {
                const fname = `SAM_Direct_${Date.now()}_${found}.pdf`;
                fs.writeFileSync(path.join(OUTPUT_DIR, fname), file.buffer);
                log(`✅ MATCH! "${matched.join('", "')}" in ${file.name}`);
                log(`💾 ${fname}`);
                send({ type: 'result', match: { oppTitle: 'Direct Lookup', solicitation: TARGET_URL.substring(0, 60), link: file.url, filename: fname } });
                found++;
            } else {
                log(`❌ ${file.name}: no matches (${(text.length / 1000).toFixed(0)}k chars)`);
            }
        }

        log(`\n🏁 Done. ${capturedFiles.length} files checked, ${found} matched.`);
    } catch (err) {
        log(`❌ ${err.message}`);
    }

    await browser.close();
}

directLookup();
