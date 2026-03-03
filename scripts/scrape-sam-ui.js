// scripts/scrape-sam-ui.js
// Puppeteer-based scraper that navigates SAM.gov like a real user
// Bypasses API rate limits by using browser automation
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
    console.log(`[UI Scraper] Already seen: ${seenList.length} opportunities`);
    console.log(`[UI Scraper] Keywords: ${KEYWORDS.join(', ')}`);

    console.log(`[UI Scraper] Launching headless browser...`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Mask puppeteer
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Enable file download interception
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'deny' // We'll handle downloads via fetch
    });

    let successfulDownloads = 0;

    for (const naics of NAICS_CODES) {
        if (successfulDownloads >= 3) break;

        // Search specifically for Combined Synopsis/Solicitation (most likely to have full RFP PDFs)
        console.log(`\n[UI Scraper] 📡 NAICS ${naics} — searching Combined Synopsis/Solicitations...`);
        const searchUrl = `https://sam.gov/search/?index=opp&page=1&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordRadio%5D=ALL&sfm%5BnoticeType%5D%5B0%5D=Combined%20Synopsis%2FSolicitation&sfm%5BnoticeType%5D%5B1%5D=Solicitation&sfm%5Bnaics%5D%5B0%5D%5Bkey%5D=${naics}&sfm%5Bnaics%5D%5B0%5D%5Bvalue%5D=${naics}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        } catch (err) {
            console.log(`[UI Scraper] Error loading search: ${err.message}`);
            continue;
        }

        // Wait for Angular/React to render results
        await delay(5000);

        // Extract opportunity links — try multiple selectors since SAM.gov layout can vary
        const oppLinks = await page.evaluate(() => {
            const selectors = [
                'a[href*="/opp/"]',
                'a.usa-link',
                'a.margin-bottom-2',
                '.opportunity-link',
                'a[data-cy="opp-link"]'
            ];
            const links = [];
            for (const sel of selectors) {
                const elements = document.querySelectorAll(sel);
                elements.forEach(a => {
                    if (a.href && a.href.includes('/opp/') && a.href.includes('/view')) {
                        links.push(a.href);
                    }
                });
            }
            return [...new Set(links)]; // deduplicate
        });

        const uniqueLinks = oppLinks.slice(0, 15); // Check top 15

        if (uniqueLinks.length === 0) {
            console.log(`[UI Scraper] No opportunities found for NAICS ${naics}`);
            // Try to log the page content for debugging
            const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || 'empty');
            console.log(`[UI Scraper] Page content preview: ${bodyText}`);
            continue;
        }

        console.log(`[UI Scraper] Found ${uniqueLinks.length} listings. Inspecting...`);

        for (const link of uniqueLinks) {
            if (successfulDownloads >= 3) break;

            const match = link.match(/\/opp\/([^/]+)\//);
            const noticeId = match ? match[1] : null;

            if (noticeId && seenList.includes(noticeId)) {
                console.log(`[UI Scraper] ⏭️ Skipping ${noticeId} (Already seen)`);
                continue;
            }

            console.log(`\n[UI Scraper] 🔎 Visiting: ${link}`);
            try {
                await page.goto(link, { waitUntil: 'networkidle2', timeout: 45000 });
                await delay(4000); // Wait for attachments to render (SAM.gov loads them asynchronously)

                // Look for ALL possible attachment links with broader selectors
                const attachmentLinks = await page.evaluate(() => {
                    const links = [];

                    // Method 1: Any link with 'download' in the href
                    document.querySelectorAll('a[href*="download"]').forEach(a => {
                        if (a.href) links.push({ href: a.href, text: a.innerText?.trim() || '' });
                    });

                    // Method 2: Links ending in common document extensions
                    document.querySelectorAll('a').forEach(a => {
                        const href = (a.href || '').toLowerCase();
                        if (href.endsWith('.pdf') || href.endsWith('.doc') || href.endsWith('.docx')) {
                            links.push({ href: a.href, text: a.innerText?.trim() || '' });
                        }
                    });

                    // Method 3: Look in the Attachments/Links section specifically
                    document.querySelectorAll('a[href*="api.sam.gov"]').forEach(a => {
                        if (a.href) links.push({ href: a.href, text: a.innerText?.trim() || '' });
                    });

                    // Method 4: SAM.gov sometimes puts files in resource links
                    document.querySelectorAll('a[href*="/resource/"]').forEach(a => {
                        if (a.href) links.push({ href: a.href, text: a.innerText?.trim() || '' });
                    });

                    // Deduplicate by href
                    const seen = new Set();
                    return links.filter(l => {
                        if (seen.has(l.href)) return false;
                        seen.add(l.href);
                        return true;
                    });
                });

                if (attachmentLinks.length === 0) {
                    console.log(`[UI Scraper] No attachments found on page.`);
                    if (noticeId) markAsSeen(noticeId);
                    continue;
                }

                console.log(`[UI Scraper] Found ${attachmentLinks.length} potential attachments:`);
                attachmentLinks.forEach((a, i) => console.log(`  [${i + 1}] ${a.text || 'unnamed'} → ${a.href.substring(0, 80)}...`));

                for (const attachment of attachmentLinks) {
                    if (successfulDownloads >= 3) break;

                    console.log(`[UI Scraper] 📥 Fetching: ${attachment.text || attachment.href.substring(0, 60)}`);

                    let bufferData;
                    try {
                        bufferData = await page.evaluate(async (url) => {
                            try {
                                const res = await fetch(url, { redirect: 'follow' });
                                if (!res.ok) return null;
                                const buf = await res.arrayBuffer();
                                return Array.from(new Uint8Array(buf));
                            } catch {
                                return null;
                            }
                        }, attachment.href);
                    } catch (err) {
                        console.log(`[UI Scraper] Fetch error: ${err.message}`);
                        continue;
                    }

                    if (!bufferData || bufferData.length === 0) {
                        console.log(`[UI Scraper] Failed to download.`);
                        continue;
                    }

                    const buffer = Buffer.from(bufferData);

                    // Size guard
                    if (buffer.length < 5000) {
                        console.log(`[UI Scraper] ⏭️ Too small (${(buffer.length / 1024).toFixed(1)}KB)`);
                        continue;
                    }
                    if (buffer.length > 50 * 1024 * 1024) {
                        console.log(`[UI Scraper] ⏭️ Too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
                        continue;
                    }

                    console.log(`[UI Scraper] 📄 Downloaded ${(buffer.length / 1024).toFixed(0)}KB`);

                    let text = '';
                    try {
                        const parsed = await pdfParse(buffer);
                        text = parsed.text.toLowerCase();
                    } catch (e) {
                        console.log(`[UI Scraper] ❌ Not a readable PDF, skipping.`);
                        continue;
                    }

                    const pageCount = text.split(/\f/).length;
                    console.log(`[UI Scraper] 📑 Parsed ${pageCount} pages, ${text.length.toLocaleString()} chars`);

                    if (text.length < 500) {
                        console.log(`[UI Scraper] ⏭️ Too little text (scanned/image PDF?)`);
                        continue;
                    }

                    const matched = KEYWORDS.filter(kw => text.includes(kw));
                    if (matched.length > 0) {
                        console.log(`[UI Scraper] ✅ MATCH! Found: "${matched.join('", "')}"`);

                        const safeFilename = `SAM_UI_${noticeId || Date.now()}.pdf`;
                        const filepath = path.join(OUTPUT_DIR, safeFilename);

                        fs.writeFileSync(filepath, buffer);
                        console.log(`[UI Scraper] 💾 Saved: ${filepath}`);
                        successfulDownloads++;
                        break;
                    } else {
                        console.log(`[UI Scraper] ❌ No keyword matches.`);
                    }
                }
            } catch (err) {
                console.log(`[UI Scraper] Error: ${err.message}`);
            }
            if (noticeId) markAsSeen(noticeId);
        }
    }

    await browser.close();

    if (successfulDownloads === 0) {
        console.log('\n[UI Scraper] ⚠️ No matching PDFs found this run. Try different NAICS codes or broader keywords.');
    } else {
        console.log(`\n[UI Scraper] 🎉 Finished! Saved ${successfulDownloads} PDFs to ${OUTPUT_DIR}`);
    }
}

scrapeSamUI();
