// scripts/scrape-sam-ui.js
// Deep fix: uses response.buffer() for downloads, navigates deeper, tries all PDFs
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
    : [
        'section l', 'section m', 'schedule l', 'schedule m',
        'instructions to offerors', 'evaluation criteria',
        'evaluation factors', 'proposal preparation',
        'proposal instructions', 'technical approach',
        'past performance', 'volume i', 'volume ii'
    ];

const SEEN_FILE = path.join(OUTPUT_DIR, 'seen_solicitations.json');
let seenList = [];

function loadSeen() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    try { seenList = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { }
}
function markAsSeen(id) {
    if (!id || seenList.includes(id)) return;
    seenList.push(id);
    fs.writeFileSync(SEEN_FILE, JSON.stringify(seenList, null, 2));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Download a file using Node's http/https with cookies from the browser
function downloadWithCookies(url, cookies) {
    return new Promise((resolve, reject) => {
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, {
            headers: {
                'Cookie': cookieHeader,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://sam.gov/'
            },
            timeout: 30000
        }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                downloadWithCookies(res.headers.location, cookies).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function scrapeSamUI() {
    loadSeen();
    console.log(`[UI] Seen: ${seenList.length} | Keywords: ${KEYWORDS.length} | NAICS: ${NAICS_CODES.length}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    let successfulDownloads = 0;

    for (const naics of NAICS_CODES) {
        if (successfulDownloads >= 3) break;

        console.log(`\n[UI] 📡 NAICS ${naics}...`);
        const searchUrl = `https://sam.gov/search/?index=opp&page=1&pageSize=25&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5Bnaics%5D%5B0%5D%5Bkey%5D=${naics}&sfm%5Bnaics%5D%5B0%5D%5Bvalue%5D=${naics}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch (err) {
            console.log(`[UI] ⚠️ Page timeout: ${err.message}`);
            continue;
        }
        await delay(5000);

        const oppLinks = await page.evaluate(() => {
            const links = new Set();
            document.querySelectorAll('a[href*="/opp/"]').forEach(a => {
                if (a.href.includes('/view')) links.add(a.href);
            });
            document.querySelectorAll('a.usa-link').forEach(a => {
                if (a.href && a.href.includes('/opp/')) links.add(a.href);
            });
            return [...links];
        });

        if (oppLinks.length === 0) {
            console.log(`[UI] No listings found for NAICS ${naics}`);
            continue;
        }

        console.log(`[UI] Found ${oppLinks.length} listings`);

        for (const link of oppLinks.slice(0, 15)) {
            if (successfulDownloads >= 3) break;

            const match = link.match(/\/opp\/([^/]+)/);
            const noticeId = match ? match[1] : null;
            if (noticeId && seenList.includes(noticeId)) continue;

            console.log(`\n[UI] 🔎 ${link.substring(link.indexOf('/opp/'))}`);

            // Collect file responses via network interception
            const capturedFiles = [];

            const responseHandler = async (response) => {
                try {
                    const url = response.url();
                    const ct = response.headers()['content-type'] || '';
                    const cd = response.headers()['content-disposition'] || '';

                    // Capture PDF responses or file downloads
                    if (ct.includes('pdf') || cd.includes('attachment') || cd.includes('.pdf') || url.includes('/download')) {
                        const buffer = await response.buffer();
                        if (buffer.length > 5000) {
                            const name = cd.split('filename=')[1]?.replace(/"/g, '').trim() || `download_${capturedFiles.length}.pdf`;
                            capturedFiles.push({ buffer, name, url });
                            console.log(`[UI] 📡 Captured file: ${name} (${(buffer.length / 1024).toFixed(0)}KB)`);
                        }
                    }
                } catch { /* response might be consumed or unavailable */ }
            };

            page.on('response', responseHandler);

            try {
                await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });
                await delay(5000);

                // Click "Attachments/Links" tab
                try {
                    const clicked = await page.evaluate(() => {
                        const elements = document.querySelectorAll('a, button, [role="tab"], .tab-label, mat-tab, [class*="tab"]');
                        for (const el of elements) {
                            const text = (el.textContent || '').toLowerCase();
                            if (text.includes('attachment') || text.includes('document') || text.includes('file')) {
                                el.click();
                                return text.trim().substring(0, 30);
                            }
                        }
                        return null;
                    });
                    if (clicked) {
                        console.log(`[UI] 📂 Clicked: "${clicked}"`);
                        await delay(4000);
                    }
                } catch { }

                // Now find attachment download links and click them to trigger downloads
                const downloadLinks = await page.evaluate(() => {
                    const links = [];
                    document.querySelectorAll('a').forEach(a => {
                        const href = a.href || '';
                        const text = (a.textContent || '').trim();
                        if (
                            href.includes('/download') || href.includes('api.sam.gov') ||
                            href.includes('/resource/') ||
                            href.toLowerCase().endsWith('.pdf') ||
                            href.toLowerCase().endsWith('.doc') ||
                            href.toLowerCase().endsWith('.docx') ||
                            (text.toLowerCase().includes('.pdf') && href.length > 10)
                        ) {
                            links.push({ href, text: text.substring(0, 80) });
                        }
                    });
                    return links;
                });

                console.log(`[UI] 📎 DOM links: ${downloadLinks.length} | Intercepted: ${capturedFiles.length}`);

                // Try clicking each download link (triggers response interception)
                for (const dl of downloadLinks) {
                    if (successfulDownloads >= 3) break;
                    console.log(`[UI] 📥 Clicking: ${dl.text || dl.href.substring(0, 60)}`);

                    try {
                        // Navigate to the download link (will be intercepted)
                        const navPromise = page.goto(dl.href, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => null);
                        await delay(5000);
                        await navPromise;
                    } catch { }

                    // Go back to the opportunity page
                    try { await page.goBack({ waitUntil: 'networkidle2', timeout: 15000 }); } catch { }
                    await delay(2000);
                }

                // Also try direct Node download with browser cookies for links we found
                if (capturedFiles.length === 0 && downloadLinks.length > 0) {
                    console.log(`[UI] ⬇️ Trying direct download with browser cookies...`);
                    const cookies = await page.cookies();

                    for (const dl of downloadLinks.slice(0, 5)) {
                        try {
                            const buffer = await downloadWithCookies(dl.href, cookies);
                            if (buffer.length > 5000) {
                                capturedFiles.push({ buffer, name: dl.text || 'download.pdf', url: dl.href });
                                console.log(`[UI] 📡 Downloaded: ${dl.text} (${(buffer.length / 1024).toFixed(0)}KB)`);
                            }
                        } catch (err) {
                            console.log(`[UI] ⚠️ ${err.message}`);
                        }
                    }
                }

                // Check ALL captured files for keywords
                for (const file of capturedFiles) {
                    if (successfulDownloads >= 3) break;

                    let text = '';
                    try {
                        const parsed = await pdfParse(file.buffer);
                        text = parsed.text.toLowerCase();
                    } catch {
                        console.log(`[UI] ❌ ${file.name}: not a readable PDF`);
                        continue;
                    }

                    if (text.length < 200) {
                        console.log(`[UI] ⏭️ ${file.name}: scanned/image PDF`);
                        continue;
                    }

                    const matched = KEYWORDS.filter(kw => text.includes(kw));
                    if (matched.length > 0) {
                        console.log(`[UI] ✅ MATCH! "${matched.join('", "')}" in ${file.name}`);
                        const safeName = `SAM_UI_${noticeId || Date.now()}_${successfulDownloads}.pdf`;
                        fs.writeFileSync(path.join(OUTPUT_DIR, safeName), file.buffer);
                        console.log(`[UI] 💾 Saved: ${safeName}`);
                        successfulDownloads++;
                    } else {
                        console.log(`[UI] ❌ ${file.name}: no keyword matches (${(text.length / 1000).toFixed(0)}k chars)`);
                    }
                }

            } catch (err) {
                console.log(`[UI] ⚠️ ${err.message}`);
            } finally {
                page.removeListener('response', responseHandler);
            }
            if (noticeId) markAsSeen(noticeId);
        }
    }

    await browser.close();
    console.log(successfulDownloads > 0
        ? `\n[UI] 🎉 Done! ${successfulDownloads} PDFs saved to ${OUTPUT_DIR}`
        : `\n[UI] ⚠️ No matches found. Try different NAICS or keywords.`);
}

scrapeSamUI();
