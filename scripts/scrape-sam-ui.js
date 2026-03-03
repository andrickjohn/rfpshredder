// scripts/scrape-sam-ui.js
// Strategy 2: Puppeteer with network interception
// Captures attachment URLs from SAM.gov's async XHR calls instead of parsing DOM
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

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
    if (fs.existsSync(SEEN_FILE)) {
        try { seenList = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch (e) { }
    }
}

function markAsSeen(id) {
    if (!id || seenList.includes(id)) return;
    seenList.push(id);
    fs.writeFileSync(SEEN_FILE, JSON.stringify(seenList, null, 2));
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeSamUI() {
    loadSeen();
    console.log(`[UI] Already seen: ${seenList.length} opportunities`);
    console.log(`[UI] Keywords: ${KEYWORDS.join(', ')}`);
    console.log(`[UI] NAICS: ${NAICS_CODES.join(', ')}`);

    console.log(`[UI] 🚀 Launching browser...`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set a larger viewport so SAM.gov renders more content
    await page.setViewport({ width: 1920, height: 1080 });

    let successfulDownloads = 0;

    for (const naics of NAICS_CODES) {
        if (successfulDownloads >= 3) break;

        // Filter for Combined Synopsis/Solicitation + Solicitation (most likely to have RFP PDFs)
        console.log(`\n[UI] 📡 NAICS ${naics} — Combined Synopsis/Solicitations...`);
        const searchUrl = `https://sam.gov/search/?index=opp&page=1&pageSize=25&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BnoticeType%5D%5B0%5D=Combined%20Synopsis%2FSolicitation&sfm%5BnoticeType%5D%5B1%5D=Solicitation&sfm%5Bnaics%5D%5B0%5D%5Bkey%5D=${naics}&sfm%5Bnaics%5D%5B0%5D%5Bvalue%5D=${naics}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch (err) {
            console.log(`[UI] ⚠️ Page timeout: ${err.message}`);
            continue;
        }

        // Wait for Angular to render
        await delay(5000);

        // Extract opportunity links using multiple selector strategies
        const oppLinks = await page.evaluate(() => {
            const links = new Set();
            // Strategy 1: Any anchor with /opp/ in href
            document.querySelectorAll('a[href*="/opp/"]').forEach(a => {
                if (a.href.includes('/view')) links.add(a.href);
            });
            // Strategy 2: usa-link class
            document.querySelectorAll('a.usa-link').forEach(a => {
                if (a.href.includes('/opp/')) links.add(a.href);
            });
            return [...links];
        });

        if (oppLinks.length === 0) {
            console.log(`[UI] No listings found. Page might be blocked or empty.`);
            const title = await page.title();
            console.log(`[UI] Page title: "${title}"`);
            continue;
        }

        console.log(`[UI] Found ${oppLinks.length} listings. Inspecting...`);

        for (const link of oppLinks.slice(0, 15)) {
            if (successfulDownloads >= 3) break;

            const match = link.match(/\/opp\/([^/]+)/);
            const noticeId = match ? match[1] : null;

            if (noticeId && seenList.includes(noticeId)) {
                console.log(`[UI] ⏭️ Skip ${noticeId} (seen)`);
                continue;
            }

            console.log(`\n[UI] 🔎 Visiting: ${link}`);

            // ---- NETWORK INTERCEPTION: Capture attachment data from XHR ----
            let capturedAttachments = [];

            const responseHandler = async (response) => {
                const url = response.url();
                // SAM.gov fetches attachments via its API
                if (url.includes('api.sam.gov') && url.includes('opportunities')) {
                    try {
                        const json = await response.json();
                        // Look for attachment data in various response shapes
                        const attachments = json.attachments || json.data?.attachments ||
                            json.opportunityData?.attachments || [];
                        if (attachments.length > 0) {
                            capturedAttachments = capturedAttachments.concat(attachments);
                            console.log(`[UI] 📡 Intercepted ${attachments.length} attachments from API`);
                        }
                        // Also check for resourceLinks
                        const links = json.resourceLinks || json.data?.resourceLinks ||
                            json.opportunityData?.resourceLinks || [];
                        if (links.length > 0) {
                            links.forEach(l => {
                                capturedAttachments.push({ url: l, name: 'resource_link' });
                            });
                            console.log(`[UI] 📡 Intercepted ${links.length} resource links from API`);
                        }
                    } catch { /* response wasn't JSON */ }
                }
            };

            page.on('response', responseHandler);

            try {
                await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });
                // Wait extra time for async attachment loading
                await delay(6000);

                // Also try clicking the "Attachments/Links" tab if it exists
                try {
                    const tabClicked = await page.evaluate(() => {
                        const tabs = document.querySelectorAll('a, button, [role="tab"]');
                        for (const tab of tabs) {
                            const text = (tab.textContent || '').toLowerCase();
                            if (text.includes('attachment') || text.includes('document') || text.includes('file')) {
                                tab.click();
                                return text.trim();
                            }
                        }
                        return null;
                    });
                    if (tabClicked) {
                        console.log(`[UI] 📂 Clicked tab: "${tabClicked}"`);
                        await delay(4000); // Wait for tab content to load
                    }
                } catch { /* tab not found, that's OK */ }

                // ---- Try DOM selectors as fallback ----
                const domLinks = await page.evaluate(() => {
                    const found = [];
                    // All links that could be attachments
                    document.querySelectorAll('a').forEach(a => {
                        const href = a.href || '';
                        const text = (a.textContent || '').trim();
                        if (
                            href.includes('/download') ||
                            href.includes('api.sam.gov') ||
                            href.includes('/resource/') ||
                            href.toLowerCase().endsWith('.pdf') ||
                            href.toLowerCase().endsWith('.doc') ||
                            href.toLowerCase().endsWith('.docx') ||
                            (text.toLowerCase().includes('download') && href.length > 10) ||
                            (text.toLowerCase().includes('attachment') && href.length > 10)
                        ) {
                            found.push({ url: href, name: text || 'unknown' });
                        }
                    });
                    return found;
                });

                // Combine intercepted + DOM-found links, deduplicate
                const allAttachmentUrls = new Map();
                [...capturedAttachments, ...domLinks].forEach(a => {
                    const url = a.url || a.href || '';
                    if (url && url.startsWith('http')) {
                        allAttachmentUrls.set(url, a.name || 'attachment');
                    }
                });

                if (allAttachmentUrls.size === 0) {
                    console.log(`[UI] No attachments found (intercepted: ${capturedAttachments.length}, DOM: ${domLinks.length})`);
                    if (noticeId) markAsSeen(noticeId);
                    continue;
                }

                console.log(`[UI] 📎 ${allAttachmentUrls.size} unique attachments found`);

                for (const [url, name] of allAttachmentUrls) {
                    if (successfulDownloads >= 3) break;

                    // Skip non-document files by name
                    const ext = name.split('.').pop()?.toLowerCase() || '';
                    if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif', 'msg', 'pptx'].includes(ext)) {
                        console.log(`[UI] ⏭️ Skip ${ext.toUpperCase()}: ${name}`);
                        continue;
                    }

                    console.log(`[UI] 📥 Fetching: ${name.substring(0, 60)}`);

                    let bufferData;
                    try {
                        bufferData = await page.evaluate(async (fetchUrl) => {
                            try {
                                const res = await fetch(fetchUrl, { redirect: 'follow' });
                                if (!res.ok) return null;
                                const buf = await res.arrayBuffer();
                                return Array.from(new Uint8Array(buf));
                            } catch {
                                return null;
                            }
                        }, url);
                    } catch (err) {
                        console.log(`[UI] ⚠️ Fetch error: ${err.message}`);
                        continue;
                    }

                    if (!bufferData || bufferData.length === 0) {
                        console.log(`[UI] ❌ Download failed`);
                        continue;
                    }

                    const buffer = Buffer.from(bufferData);

                    if (buffer.length < 5000) {
                        console.log(`[UI] ⏭️ Too small (${(buffer.length / 1024).toFixed(1)}KB)`);
                        continue;
                    }
                    if (buffer.length > 50 * 1024 * 1024) {
                        console.log(`[UI] ⏭️ Too large`);
                        continue;
                    }

                    console.log(`[UI] 📄 ${(buffer.length / 1024).toFixed(0)}KB downloaded`);

                    let text = '';
                    try {
                        const parsed = await pdfParse(buffer);
                        text = parsed.text.toLowerCase();
                    } catch {
                        console.log(`[UI] ❌ Not a readable PDF`);
                        continue;
                    }

                    const pageCount = text.split(/\f/).length;
                    console.log(`[UI] 📑 ${pageCount} pages, ${text.length.toLocaleString()} chars`);

                    if (text.length < 500) {
                        console.log(`[UI] ⏭️ Scanned/image PDF`);
                        continue;
                    }

                    const matched = KEYWORDS.filter(kw => text.includes(kw));
                    if (matched.length > 0) {
                        console.log(`[UI] ✅ MATCH! Found: "${matched.join('", "')}"`);

                        const safeFilename = `SAM_UI_${noticeId || Date.now()}.pdf`;
                        const filepath = path.join(OUTPUT_DIR, safeFilename);
                        fs.writeFileSync(filepath, buffer);
                        console.log(`[UI] 💾 Saved: ${filepath}`);
                        successfulDownloads++;
                        break;
                    } else {
                        console.log(`[UI] ❌ No keyword matches`);
                    }
                }
            } catch (err) {
                console.log(`[UI] ⚠️ Error: ${err.message}`);
            } finally {
                page.removeListener('response', responseHandler);
            }

            if (noticeId) markAsSeen(noticeId);
        }
    }

    await browser.close();

    if (successfulDownloads === 0) {
        console.log('\n[UI] ⚠️ No matching PDFs found. Try different NAICS codes or broader keywords.');
    } else {
        console.log(`\n[UI] 🎉 Done! Saved ${successfulDownloads} PDFs to ${OUTPUT_DIR}`);
    }
}

scrapeSamUI();
