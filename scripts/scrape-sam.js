const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const API_KEY = process.env.SAM_GOV_API_KEY || 'SAM-0fbe5a1c-7d31-4f8e-896d-3d9a1dbd8800';
const NAICS_CODES = ['541511', '541512', '541519', '541611', '541330'];

const today = new Date();
const postedTo = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
const past = new Date(today);
past.setDate(past.getDate() - 180);
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

function detectSectionLM(text) {
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

    // Filter: skip awards < $5M (keep all notice types)
    const MIN_AWARD = 5_000_000;
    const filteredOpps = opps.filter(o => {
        const award = Number(o.award?.amount || o.estimatedTotalValue || o.awardAmount || 0);
        if (award > 0 && award < MIN_AWARD) return false;
        return true;
    });

    console.log(`Filtered to ${filteredOpps.length} opportunities (≥$${MIN_AWARD / 1_000_000}M).`);

    let successfulDownloads = 0;

    for (const opp of filteredOpps) {
        if (successfulDownloads >= 3) {
            console.log('✅ Found 3 samples! Stopping.');
            break;
        }

        if (!opp.resourceLinks || opp.resourceLinks.length === 0) {
            continue;
        }

        console.log(`Checking Opportunity: ${opp.title} (${opp.solicitationNumber})`);

        // Phase 1: HEAD all links, score filenames
        const scored = [];
        for (const link of opp.resourceLinks) {
            await delay(1500);
            try {
                const downloadUrl = link.includes('api_key=') ? link : `${link}?api_key=${API_KEY}`;
                const headRes = await fetchWithBackoff(downloadUrl, { method: 'HEAD' });
                const contentDisp = headRes.headers.get('content-disposition') || '';
                const filename = contentDisp.split('filename="')[1]?.split('"')[0] || link.split('/').pop() || '';
                const s = scoreAttachment(filename, opp.solicitationNumber);
                scored.push({ link, downloadUrl, filename, contentDisp, score: s });
            } catch { }
        }
        scored.sort((a, b) => b.score - a.score);
        const topLinks = scored.length <= 6 ? scored : scored.slice(0, 6);
        console.log(`  📊 Scored ${scored.length} links → downloading ${topLinks.length}${scored.length <= 6 ? ' (all)' : ' (top 6)'}`);
        if (scored.length > 0) {
            console.log(`  📊 ${scored.map(s => `${s.filename.substring(0, 40)}(${s.score})`).join(', ')}`);
        }

        // Phase 2: Download only top-scored attachments
        for (const item of topLinks) {
            await delay(1500);

            try {
                // Skip obvious non-PDFs
                if (item.contentDisp && !item.contentDisp.toLowerCase().includes('.pdf') && item.contentDisp.includes('.')) {
                    continue;
                }

                const fileRes = await fetchWithBackoff(item.downloadUrl);
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
                    console.log(`  📄 [score:${item.score}] ${item.filename} — ${text.length} chars`);
                } catch (parseErr) {
                    console.log(`  ❌ Failed to parse as PDF: ${parseErr.message.substring(0, 50)}...`);
                    continue;
                }

                const detection = detectSectionLM(text);
                if (detection.match) {
                    console.log(`  🔍 MATCH [${detection.confidence}%] ${detection.patterns.join(' + ')}`);

                    const safeFilename = item.filename ? item.filename.replace(/[^a-z0-9.-]/gi, '_') : `${opp.solicitationNumber}.pdf`;
                    const filepath = path.join(OUTPUT_DIR, safeFilename);

                    fs.writeFileSync(filepath, buffer);
                    console.log(`  💾 Saved: ${filepath}`);
                    successfulDownloads++;
                    break;
                } else {
                    console.log(`  ❌ No L+M (confidence: ${detection.confidence}%)`);
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
