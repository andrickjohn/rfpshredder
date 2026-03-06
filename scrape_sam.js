const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const downloadDir = path.join(__dirname, 'samples/sam_rfps/actuals');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

async function waitForDownloads(dir) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = setInterval(() => {
            const files = fs.readdirSync(dir);
            const isDownloading = files.some(f => f.endsWith('.crdownload') || f.endsWith('.tmp'));
            if (!isDownloading && files.length > 0) {
                clearInterval(check);
                resolve();
            }
            attempts++;
            if (attempts > 30) {
                clearInterval(check);
                resolve();
            }
        }, 1000);
    });
}

(async () => {
    console.log('Launching browser to scrape SAM.gov...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--window-size=1280,1024']
    });

    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadDir,
    });

    await page.setViewport({ width: 1280, height: 1024 });

    const searchUrl = 'https://sam.gov/search/?index=opp&page=1&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordRadio%5D=ALL&sfm%5BsimpleSearch%5D%5BkeywordTags%5D=%5B%7B%22key%22%3A%22%5C%22Section%20L%5C%22%22%2C%22value%22%3A%22%5C%22Section%20L%5C%22%22%7D%2C%7B%22key%22%3A%22%5C%22Section%20M%5C%22%22%2C%22value%22%3A%22%5C%22Section%20M%5C%22%22%7D%5D';

    console.log('Navigating to SAM.gov search results...');
    try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
        console.log('Navigation timeout. Proceeding...');
    }

    console.log('Waiting for search results to render...');
    try {
        await page.waitForSelector('a.sds-button-link', { timeout: 30000 });
    } catch (e) {
        console.log('Could not find links immediately, waiting an extra 5s...');
        await delay(5000);
    }

    const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
            .map(a => a.href)
            .filter(href => href && href.includes('/opp/') && href.includes('/view'))
            // unique
            .filter((value, index, self) => self.indexOf(value) === index)
            .slice(0, 5);
    }).catch(e => {
        console.error("DOM error getting links", e);
        return [];
    });

    console.log(`Found ${links.length} unique solicitations. Visiting them...`);

    let totalDownloaded = 0;

    for (let i = 0; i < links.length; i++) {
        if (totalDownloaded >= 10) break;

        console.log(`\nVisiting Solicitation ${i + 1}/${links.length}: ${links[i]}`);
        try {
            await page.goto(links[i], { waitUntil: 'domcontentloaded', timeout: 45000 });

            // Wait specifically for the attachments table
            await page.waitForSelector('#attachments-links', { timeout: 15000 }).catch(() => { });
            await delay(3000); // Give React time to hydrate the table

            const attachmentLinks = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return anchors.filter(a => a.href && a.href.includes('/api/prod/opps') && a.href.includes('/download')).map(a => ({
                    text: a.innerText || a.textContent || a.href,
                    url: a.href
                }));
            }).catch(() => []);

            console.log(`Found ${attachmentLinks.length} total downloads on this page.`);

            let clickedOnPage = 0;
            for (const link of attachmentLinks) {
                if (clickedOnPage >= 4) break;
                if (totalDownloaded >= 10) break;

                const lowerText = link.text.toLowerCase();
                const isValuable = lowerText.includes('.pdf') || lowerText.includes('l') || lowerText.includes('m') || lowerText.includes('solicitation');

                if (isValuable) {
                    console.log(`Triggering download for: ${link.text.trim().substring(0, 50)}...`);
                    await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => { }); // direct navigation to trigger download

                    await delay(2000);
                    clickedOnPage++;
                    totalDownloaded++;
                }
            }

            if (clickedOnPage > 0) {
                console.log('Waiting for downloads to flush to disk...');
                await waitForDownloads(downloadDir);
            }

        } catch (err) {
            console.log(`Error processing ${links[i]}: ${err.message}`);
        }
    }

    console.log('\nClosing browser...');
    await browser.close();

    const finalFiles = fs.readdirSync(downloadDir);
    console.log(`\nDONE! Mission complete. Successfully downloaded ${finalFiles.length} REAL files to:`);
    console.log(downloadDir);
})();
