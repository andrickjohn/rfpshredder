import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load env vars to get SAM_GOV_API_KEY
dotenv.config({ path: '.env.local' });

const pdfParse = require('pdf-parse');
const JSZip = require('jszip');

const API_KEY = process.env.SAM_GOV_API_KEY || '';
const SAMPLES_DIR = path.join(process.cwd(), 'samples/sam_rfps/actuals');
const SEEN_FILE = path.join(SAMPLES_DIR, 'seen_solicitations.json');

if (!API_KEY) {
    console.error('Missing SAM_GOV_API_KEY in .env.local');
    process.exit(1);
}

function ensureDir() { if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true }); }
function loadSeen() { ensureDir(); try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { return []; } }
function saveSeen(list) { fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2)); }

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchSafe(url, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.status === 429 || res.status === 503) {
                console.log(`  ⏳ Rate limited (HTTP ${res.status}). Sleeping for ${5 * Math.pow(2, i)} seconds...`);
                await delay(5000 * Math.pow(2, i));
                continue;
            }
            return res;
        } catch (err) {
            if (i === retries - 1) throw err;
            await delay(3000);
        }
    }
    throw new Error('API exhausted after 5 retries');
}

async function extractPdfsFromZip(zipBuffer) {
    const pdfs = [];
    try {
        const zip = await JSZip.loadAsync(zipBuffer);
        for (const [filename, file] of Object.entries(zip.files)) {
            if (file.dir) continue;
            const lower = filename.toLowerCase();
            if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx')) {
                const buf = await file.async('nodebuffer');
                if (buf.length > 1000) {
                    pdfs.push({ name: filename, buffer: buf });
                }
            }
        }
    } catch { }
    return pdfs;
}

async function detectSectionLM(buffer) {
    try {
        const parsed = await pdfParse(buffer);
        const text = parsed.text.toLowerCase();
        if (text.length < 100) return { match: false, confidence: 0, patterns: [] };

        const norm = text.replace(/\s+/g, ' ');

        const lSignals = [
            ['section l', 'Section L'],
            ['part l', 'Part L'],
            ['l. instructions', 'L. Instructions'],
            ['instructions to offerors', 'Instructions to Offerors'],
            ['instructions to quoters', 'Instructions to Quoters'],
            ['proposal preparation instructions', 'Proposal Preparation Instructions'],
            ['proposal instructions', 'Proposal Instructions'],
        ];

        const mSignals = [
            ['section m', 'Section M'],
            ['part m', 'Part M'],
            ['m. evaluation', 'M. Evaluation'],
            ['evaluation criteria', 'Evaluation Criteria'],
            ['evaluation factors', 'Evaluation Factors'],
            ['evaluation factors for award', 'Evaluation Factors for Award'],
            ['basis for award', 'Basis for Award'],
        ];

        const matchedL = [];
        const matchedM = [];

        for (const [pat, label] of lSignals) {
            if (norm.includes(pat)) matchedL.push(label);
        }
        for (const [pat, label] of mSignals) {
            if (norm.includes(pat)) matchedM.push(label);
        }

        const hasL = matchedL.length > 0;
        const hasM = matchedM.length > 0;
        const match = hasL && hasM;

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
    } catch {
        return { match: false, confidence: 0, patterns: [] };
    }
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

(async () => {
    console.log(`Starting SAM.gov API Rip... Using API Key: ${API_KEY.substring(0, 6)}...`);
    const seenList = loadSeen();

    // Hard requirements from user:
    const naicsCodes = ['541330', '541511', '541512', '541611', '541715', '541519', '541618', '541990', '541690', '518210'];
    const lookbackDays = 120; // Look back further for more variety

    const today = new Date();
    const postedTo = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
    const past = new Date(today); past.setDate(past.getDate() - lookbackDays);
    const postedFrom = `${(past.getMonth() + 1).toString().padStart(2, '0')}/${past.getDate().toString().padStart(2, '0')}/${past.getFullYear()}`;

    let opps = [];

    for (const code of naicsCodes) {
        console.log(`📡 Querying NAICS ${code}...`);
        // Using limit=200 to pull a deeper pool of files
        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=200&ncode=${code}&postedFrom=${postedFrom}&postedTo=${postedTo}`;

        try {
            const res = await fetchSafe(url);
            if (!res.ok) { console.log(`  ⚠️ HTTP ${res.status}`); continue; }
            const data = await res.json();
            const items = data.opportunitiesData || [];

            const mapped = items.map(o => ({
                noticeId: o.noticeId || '', title: o.title || '',
                solicitationNumber: o.solicitationNumber || '',
                resourceLinks: o.resourceLinks || [],
            }));
            opps = opps.concat(mapped);
        } catch (err) {
            console.log(`  ❌ ${err.message}`);
        }
        await delay(1000);
    }

    // Filter unseen and shuffle the array for maximum agency variety
    let candidates = opps.filter(o => o.noticeId && !seenList.includes(o.noticeId) && o.resourceLinks.length > 0)
        .sort((a, b) => b.resourceLinks.length - a.resourceLinks.length);

    // Fisher-Yates shuffle to guarantee we don't just pull the same 5 agencies sequentially
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    console.log(`📋 Found ${candidates.length} candidate solicitations with attachments.`);

    let downloads = 0;
    let checked = 0;

    for (const opp of candidates) {
        if (downloads >= 10) break; // We want 10 MORE files
        checked++;
        console.log(`\n🔎 [${checked}/${candidates.length}] ${opp.solicitationNumber}: ${opp.title.substring(0, 50)}`);

        const scored = [];
        let hadNetworkError = false;

        for (const link of opp.resourceLinks) {
            const dlUrl = link.includes('api_key=') ? link : `${link}${link.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
            try {
                await delay(500);
                const headRes = await fetchSafe(dlUrl);
                if (!headRes.ok) continue;
                try { await headRes.text(); } catch { }
                const cd = headRes.headers.get('content-disposition') || '';
                const filename = cd.split('filename=')[1]?.replace(/"/g, '').trim() || link.split('/').pop() || '';
                const s = scoreAttachment(filename, opp.solicitationNumber);
                scored.push({ link, dlUrl, filename: filename, score: s });
            } catch { hadNetworkError = true; }
        }

        scored.sort((a, b) => b.score - a.score);
        const topLinks = scored.slice(0, 5); // check top 5

        if (topLinks.length === 0 && !hadNetworkError) {
            seenList.push(opp.noticeId);
            saveSeen(seenList);
            continue;
        }

        let allProcessedCleanly = true;
        for (const item of topLinks) {
            if (downloads >= 20) break;

            try {
                const fileRes = await fetchSafe(item.dlUrl);
                if (!fileRes.ok) { allProcessedCleanly = false; continue; }

                const arrayBuffer = await fileRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                if (buffer.length < 1000) continue;

                const header = buffer.slice(0, 5).toString('ascii');

                if (header.startsWith('PK')) {
                    const pdfs = await extractPdfsFromZip(buffer);
                    for (const pdf of pdfs) {
                        if (downloads >= 20) break;
                        const detection = await detectSectionLM(pdf.buffer);
                        if (detection.match) {
                            const safeName = `REAL_SAM_RFP_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}_${downloads}.pdf`;
                            fs.writeFileSync(path.join(SAMPLES_DIR, safeName), pdf.buffer);
                            console.log(`   ✅ MATCH ${safeName} (confidence: ${detection.confidence}%) -> Saved.`);
                            downloads++;
                        }
                    }
                    continue;
                }

                if (header.startsWith('%PDF')) {
                    const detection = await detectSectionLM(buffer);
                    if (detection.match) {
                        const safeName = `REAL_SAM_RFP_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}_${downloads}.pdf`;
                        fs.writeFileSync(path.join(SAMPLES_DIR, safeName), buffer);
                        console.log(`   ✅ MATCH ${safeName} (confidence: ${detection.confidence}%) -> Saved.`);
                        downloads++;
                    }
                }
            } catch (err) {
                allProcessedCleanly = false;
            }
        }

        if (!hadNetworkError && allProcessedCleanly) {
            seenList.push(opp.noticeId);
            saveSeen(seenList);
        }
    }

    console.log(`\n🏁 Finished! Successfully captured ${downloads} REAL RFPs loaded with L&M.`);
})();
