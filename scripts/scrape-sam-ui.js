// scripts/scrape-sam-ui.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');
const NAICS_CODES = ['541511', '541512', '541519', '511210', '236220'];

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeSamUI() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    console.log(`[UI Scraper] Launching headless browser...`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Mask puppeteer
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    let successfulDownloads = 0;

    for (const naics of NAICS_CODES) {
        if (successfulDownloads >= 3) break;

        console.log(`[UI Scraper] Querying SAM.gov website for NAICS: ${naics}`);
        // Go directly to the search page for this NAICS code
        const searchUrl = `https://sam.gov/search/?index=opp&page=1&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5Bnaics%5D%5B0%5D%5Bkey%5D=${naics}&sfm%5Bnaics%5D%5B0%5D%5Bvalue%5D=${naics}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        } catch (err) {
            console.log(`[UI Scraper] Error loading search page: ${err.message}`);
            continue;
        }

        // Wait for results to load
        await delay(3000);

        // Extract opportunity links
        const oppLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a.usa-link'));
            return links
                .map(a => a.href)
                .filter(href => href.includes('/opp/') && href.includes('/view'));
        });

        // Deduplicate
        const uniqueLinks = [...new Set(oppLinks)].slice(0, 10); // Check top 10

        if (uniqueLinks.length === 0) {
            console.log(`[UI Scraper] No opportunities found for NAICS ${naics} or page heavily blocked.`);
            continue;
        }

        console.log(`[UI Scraper] Found ${uniqueLinks.length} listings. Inspecting...`);

        for (const link of uniqueLinks) {
            if (successfulDownloads >= 3) break;

            console.log(`\n[UI Scraper] Visiting: ${link}`);
            try {
                await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
                await delay(2000); // Give it time to render attachments

                // Look for PDF attachment links
                const pdfLinks = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a'))
                        .map(a => a.href)
                        .filter(href => href.includes('/download') || href.toLowerCase().endsWith('.pdf'));
                });

                if (pdfLinks.length === 0) {
                    console.log(`[UI Scraper] No PDF attachments found.`);
                    continue;
                }

                console.log(`[UI Scraper] Found ${pdfLinks.length} potential attachments. Downloading...`);

                // Fetch each PDF using page.evaluate to fetch from within browser context
                for (const pdfLink of pdfLinks) {
                    console.log(`[UI Scraper] Fetching: ${pdfLink}`);

                    const bufferData = await page.evaluate(async (url) => {
                        const res = await fetch(url);
                        if (!res.ok) return null;
                        const buf = await res.arrayBuffer();
                        return Array.from(new Uint8Array(buf));
                    }, pdfLink);

                    if (!bufferData) {
                        console.log(`[UI Scraper] Failed to download.`);
                        continue;
                    }

                    const buffer = Buffer.from(bufferData);
                    let text = '';
                    try {
                        const parsed = await pdfParse(buffer);
                        text = parsed.text.toLowerCase();
                    } catch (e) {
                        console.log(`[UI Scraper] Skipping - not a valid PDF.`);
                        continue;
                    }

                    if (text.includes('section l') || text.includes('section m') || text.includes('schedule l') || text.includes('schedule m')) {
                        console.log(`[UI Scraper] ✅ FOUND: Section L/M keywords match!`);

                        const safeFilename = `SAM_UI_Scraped_${Date.now()}.pdf`;
                        const filepath = path.join(OUTPUT_DIR, safeFilename);

                        fs.writeFileSync(filepath, buffer);
                        console.log(`[UI Scraper] 💾 Saved: ${filepath}`);
                        successfulDownloads++;
                        break;
                    } else {
                        console.log(`[UI Scraper] ❌ Checked PDF: No L/M found.`);
                    }
                }
            } catch (err) {
                console.log(`[UI Scraper] Error visiting opportunity: ${err.message}`);
            }
        }
    }

    await browser.close();

    if (successfulDownloads === 0) {
        console.log('[UI Scraper] ⚠️ Could not find 3 PDFs with Section/Schedule L/M via UI.');
    } else {
        console.log(`[UI Scraper] 🎉 Finished. Saved ${successfulDownloads} PDFs via UI.`);
    }
}

scrapeSamUI();
