// scripts/scrape-sam-direct.js
// Direct lookup script: navigate to a single SAM.gov URL and download all attachments
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');
const TARGET_URL = process.env.TARGET_URL || '';
const KEYWORDS = process.env.TARGET_KEYWORDS
    ? process.env.TARGET_KEYWORDS.split(',')
    : ['section l', 'section m', 'schedule l', 'schedule m'];

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendResult(data) {
    console.log(JSON.stringify(data));
}

async function directLookup() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    if (!TARGET_URL) {
        sendResult({ type: 'log', message: '❌ No URL provided' });
        return;
    }

    // Normalize URL — if user pasted a solicitation number, build the search URL
    let url = TARGET_URL;
    if (!url.startsWith('http')) {
        url = `https://sam.gov/search/?index=opp&q=${encodeURIComponent(url)}&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true`;
        sendResult({ type: 'log', message: `🔍 Searching SAM.gov for: "${TARGET_URL}"` });
    }

    sendResult({ type: 'log', message: `🚀 Launching browser...` });
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture API responses
    let capturedAttachments = [];
    page.on('response', async (response) => {
        const respUrl = response.url();
        if (respUrl.includes('api.sam.gov') && respUrl.includes('opportunities')) {
            try {
                const json = await response.json();
                const attachments = json.attachments || json.data?.attachments || json.opportunityData?.attachments || [];
                const links = json.resourceLinks || json.data?.resourceLinks || json.opportunityData?.resourceLinks || [];
                if (attachments.length > 0) {
                    capturedAttachments = capturedAttachments.concat(attachments);
                    sendResult({ type: 'log', message: `📡 Intercepted ${attachments.length} attachments` });
                }
                if (links.length > 0) {
                    links.forEach(l => capturedAttachments.push({ url: l, name: 'resource' }));
                    sendResult({ type: 'log', message: `📡 Intercepted ${links.length} resource links` });
                }
            } catch { }
        }
    });

    try {
        sendResult({ type: 'log', message: `📄 Navigating to: ${url.substring(0, 80)}...` });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await delay(6000);

        // If this was a search, click the first result
        if (url.includes('/search/')) {
            sendResult({ type: 'log', message: `🔍 Looking for first result on search page...` });
            const firstLink = await page.evaluate(() => {
                const links = document.querySelectorAll('a[href*="/opp/"]');
                for (const a of links) {
                    if (a.href.includes('/view')) return a.href;
                }
                return null;
            });

            if (firstLink) {
                sendResult({ type: 'log', message: `📌 Found: ${firstLink}` });
                await page.goto(firstLink, { waitUntil: 'networkidle2', timeout: 60000 });
                await delay(6000);
            } else {
                sendResult({ type: 'log', message: `❌ No results found for that search` });
                await browser.close();
                return;
            }
        }

        // Try clicking Attachments tab
        try {
            await page.evaluate(() => {
                const tabs = document.querySelectorAll('a, button, [role="tab"]');
                for (const tab of tabs) {
                    const text = (tab.textContent || '').toLowerCase();
                    if (text.includes('attachment') || text.includes('document')) {
                        tab.click();
                        return;
                    }
                }
            });
            await delay(3000);
        } catch { }

        // Gather DOM links as fallback
        const domLinks = await page.evaluate(() => {
            const found = [];
            document.querySelectorAll('a').forEach(a => {
                const href = a.href || '';
                const text = (a.textContent || '').trim();
                if (
                    href.includes('/download') || href.includes('api.sam.gov') ||
                    href.includes('/resource/') || href.toLowerCase().endsWith('.pdf') ||
                    href.toLowerCase().endsWith('.doc') || href.toLowerCase().endsWith('.docx') ||
                    (text.toLowerCase().includes('download') && href.length > 10)
                ) {
                    found.push({ url: href, name: text || 'link' });
                }
            });
            return found;
        });

        // Combine all attachment sources
        const allUrls = new Map();
        [...capturedAttachments, ...domLinks].forEach(a => {
            const u = a.url || a.href || '';
            if (u && u.startsWith('http')) allUrls.set(u, a.name || 'attachment');
        });

        sendResult({ type: 'log', message: `📎 Total attachments found: ${allUrls.size}` });

        let found = 0;
        for (const [attachUrl, name] of allUrls) {
            const ext = name.split('.').pop()?.toLowerCase() || '';
            if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png'].includes(ext)) continue;

            sendResult({ type: 'log', message: `📥 Downloading: ${name.substring(0, 60)}` });

            let bufferData;
            try {
                bufferData = await page.evaluate(async (u) => {
                    try {
                        const res = await fetch(u, { redirect: 'follow' });
                        if (!res.ok) return null;
                        const buf = await res.arrayBuffer();
                        return Array.from(new Uint8Array(buf));
                    } catch { return null; }
                }, attachUrl);
            } catch { continue; }

            if (!bufferData || bufferData.length < 5000) continue;

            const buffer = Buffer.from(bufferData);
            sendResult({ type: 'log', message: `📄 ${(buffer.length / 1024).toFixed(0)}KB` });

            let text = '';
            try {
                const parsed = await pdfParse(buffer);
                text = parsed.text.toLowerCase();
            } catch {
                sendResult({ type: 'log', message: `❌ Not a readable PDF` });
                continue;
            }

            const matched = KEYWORDS.filter(kw => text.includes(kw));
            if (matched.length > 0) {
                const filename = `SAM_Direct_${Date.now()}.pdf`;
                fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
                sendResult({ type: 'log', message: `✅ MATCH! "${matched.join('", "')}"` });
                sendResult({ type: 'log', message: `💾 Saved: ${filename}` });
                sendResult({ type: 'result', match: { oppTitle: 'Direct Lookup', solicitation: TARGET_URL, link: attachUrl, filename } });
                found++;
            } else {
                sendResult({ type: 'log', message: `❌ No keyword matches` });
            }
        }

        sendResult({ type: 'log', message: `\n🏁 Done. Found ${found} matching PDFs.` });

    } catch (err) {
        sendResult({ type: 'log', message: `❌ Error: ${err.message}` });
    }

    await browser.close();
}

directLookup();
