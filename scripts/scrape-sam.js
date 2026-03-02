const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const API_KEY = process.env.SAM_GOV_API_KEY || 'SAM-0fbe5a1c-7d31-4f8e-896d-3d9a1dbd8800';
const NAICS_CODES = ['541511', '541512', '541519', '511210', '236220', '237', '238'];

const today = new Date();
const postedTo = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
const past = new Date(today);
past.setDate(past.getDate() - 30);
const postedFrom = `${(past.getMonth() + 1).toString().padStart(2, '0')}/${past.getDate().toString().padStart(2, '0')}/${past.getFullYear()}`;

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url, options = {}, retries = 3, backoff = 3000) {
    for (let i = 0; i < retries; i++) {
        const res = await fetch(url, options);
        if (res.status === 429) {
            console.log(`  ⏳ 429 Too Many Requests. Waiting ${backoff}ms...`);
            await delay(backoff);
            backoff *= 2; // exponential
            continue;
        }
        return res;
    }
    throw new Error('Too Many Requests limit exceeded');
}

async function scrapeSam() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    console.log(`Searching SAM.gov from ${postedFrom} to ${postedTo}...`);

    let opps = [];

    for (const code of NAICS_CODES) {
        console.log(`Querying NAICS: ${code}`);
        const searchUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=30&ncode=${code}&postedFrom=${postedFrom}&postedTo=${postedTo}`;

        try {
            const res = await fetchWithBackoff(searchUrl);
            if (!res.ok) {
                console.error(`API Error for ${code}: ${res.statusText}`);
                continue;
            }
            const data = await res.json();
            if (data.opportunitiesData) {
                opps = opps.concat(data.opportunitiesData);
                console.log(`  -> Found ${data.opportunitiesData.length} records`);
            }
        } catch (err) {
            console.error(`Fetch error for ${code}:`, err.message);
        }
        await delay(1500); // Rate limit protection
    }

    console.log(`Found ${opps.length} total opportunities.`);

    // Filter for "small business"
    const smallBizOpps = opps.filter(o => {
        const desc = o.typeOfSetAsideDescription ? String(o.typeOfSetAsideDescription).toLowerCase() : '';
        const setAside = o.typeOfSetAside ? String(o.typeOfSetAside).toLowerCase() : '';
        return desc.includes('small business') || setAside.includes('sba') || setAside.includes('sdb') || setAside.includes('sbe');
    });

    console.log(`Filtered down to ${smallBizOpps.length} small business opportunities.`);

    let successfulDownloads = 0;

    for (const opp of smallBizOpps) {
        if (successfulDownloads >= 3) {
            console.log('✅ Found 3 samples! Stopping.');
            break;
        }

        if (!opp.resourceLinks || opp.resourceLinks.length === 0) {
            continue;
        }

        console.log(`Checking Opportunity: ${opp.title} (${opp.solicitationNumber})`);

        for (const link of opp.resourceLinks) {
            await delay(1500); // Respect SAM download limits

            try {
                // Add API key if not present
                const downloadUrl = link.includes('api_key=') ? link : `${link}?api_key=${API_KEY}`;

                const headRes = await fetchWithBackoff(downloadUrl, { method: 'HEAD' });
                const contentDisp = headRes.headers.get('content-disposition') || '';

                // Exclude obvious non-PDFs if they have a clear extension in disposition
                if (contentDisp && !contentDisp.toLowerCase().includes('.pdf') && contentDisp.includes('.')) {
                    continue; // Skip non-pdf like .docx if we strictly want PDFs, although pdf-parse only does pdf
                }

                const fileRes = await fetchWithBackoff(downloadUrl);
                if (!fileRes.ok) {
                    console.log(`  ❌ Failed to download: HTTP ${fileRes.status}`);
                    continue;
                }

                const arrayBuffer = await fileRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                let text = '';
                try {
                    const parsed = await pdfParse(buffer);
                    text = parsed.text.toLowerCase();
                    console.log(`  📄 Parsed PDF. Char count: ${text.length}`);
                } catch (parseErr) {
                    console.log(`  ❌ Failed to parse as PDF: ${parseErr.message.substring(0, 50)}...`);
                    continue; // Not a valid PDF
                }

                if (text.includes('section l') || text.includes('section m') || text.includes('schedule l') || text.includes('schedule m')) {
                    console.log(`  🔍 Found Section L/M requirements in attachment! Saving...`);

                    const filenameExt = contentDisp ? contentDisp.split('filename="')[1]?.split('"')[0] : 'document.pdf';
                    const safeFilename = filenameExt ? filenameExt.replace(/[^a-z0-9.-]/gi, '_') : `${opp.solicitationNumber}.pdf`;
                    const filepath = path.join(OUTPUT_DIR, safeFilename);

                    fs.writeFileSync(filepath, buffer);
                    console.log(`  💾 Saved: ${filepath}`);
                    successfulDownloads++;
                    break; // Move to next opportunity
                }
            } catch (err) {
                // console.log('  ⚠️ Failed to process attachment:', err.message);
            }
        }
    }

    if (successfulDownloads === 0) {
        console.log('⚠️ Could not find 3 PDFs with Section/Schedule L/M. Try expanding the search Date Range or NAICS.');
    } else {
        console.log(`🎉 Finished. Saved ${successfulDownloads} PDFs.`);
    }
}

scrapeSam();
