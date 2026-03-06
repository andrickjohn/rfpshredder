import fs from 'fs';
import path from 'path';

const pdfParse = require('pdf-parse');
const JSZip = require('jszip');

const SAMPLES_DIR = path.join(process.cwd(), 'samples/sam_rfps/actuals');
const SEEN_FILE = path.join(SAMPLES_DIR, 'seen_solicitations.json');

function ensureDir() { if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true }); }
function loadSeen() { ensureDir(); try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { return []; } }
function saveSeen(list) { fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2)); }

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

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
            ['proposal preparation', 'Proposal Preparation'],
        ];

        const mSignals = [
            ['section m', 'Section M'],
            ['part m', 'Part M'],
            ['m. evaluation', 'M. Evaluation'],
            ['evaluation criteria', 'Evaluation Criteria'],
            ['evaluation factors', 'Evaluation Factors'],
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

        return { match, confidence };
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
    return score;
}

(async () => {
    console.log(`Starting SAM.gov Open Endpoint Rip...`);
    const seenList = loadSeen();

    // The open non-developer frontend API
    const url = `https://sam.gov/api/prod/opps/v3/search?index=opp&page=0&limit=100&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordRadio%5D=ALL&sfm%5BsimpleSearch%5D%5BkeywordTags%5D=%5B%7B%22key%22%3A%22Section%20L%22%2C%22value%22%3A%22Section%20L%22%7D%2C%7B%22key%22%3A%22Section%20M%22%2C%22value%22%3A%22Section%20M%22%7D%5D`;

    let opps = [];
    try {
        console.log(`📡 Querying primary internal SAM.gov search...`);
        const res = await fetch(url, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error(`Status ${res.status}`);
            return;
        }
        const data = await res.json();
        const items = data._embedded?.results || [];

        const mapped = items.map(o => ({
            noticeId: o._id || '',
            title: o.title || '',
            solicitationNumber: o.solicitationNumber || '',
            // The v3 endpoint structure
            resourceLinks: o.resources?.map(r => `https://sam.gov/api/prod/opps/v3/opportunities/resources/files/${r.resourceId}/download?api_key=null&token=null`) || [],
        }));
        opps = opps.concat(mapped);
    } catch (err) {
        console.log(`  ❌ ${err.message}`);
    }

    const candidates = opps.filter(o => o.noticeId && !seenList.includes(o.noticeId) && o.resourceLinks.length > 0)
        .sort(() => 0.5 - Math.random()); // Shuffle

    console.log(`📋 Found ${candidates.length} candidate solicitations with attachments.`);

    let downloads = 0;
    let checked = 0;

    for (const opp of candidates) {
        if (downloads >= 20) break;
        checked++;
        console.log(`\n🔎 [${checked}/${candidates.length}] ${opp.solicitationNumber}: ${opp.title.substring(0, 50)}`);

        // Get actual filenames via HEAD and score them
        const scored = [];
        let hadNetworkError = false;

        for (const link of opp.resourceLinks) {
            try {
                await delay(200);
                const headRes = await fetch(link, {
                    method: 'HEAD',
                    headers: { 'user-agent': 'Mozilla/5.0' }
                });
                if (!headRes.ok) continue;

                const cd = headRes.headers.get('content-disposition') || '';
                const filename = cd.split('filename=')[1]?.replace(/"/g, '').trim() || 'document.pdf';
                const s = scoreAttachment(filename, opp.solicitationNumber);
                scored.push({ link, dlUrl: link, filename: filename, score: s });
            } catch { hadNetworkError = true; }
        }

        scored.sort((a, b) => b.score - a.score);
        const topLinks = scored.slice(0, 5);

        if (topLinks.length === 0 && !hadNetworkError) {
            seenList.push(opp.noticeId);
            saveSeen(seenList);
            continue;
        }

        let allProcessedCleanly = true;
        for (const item of topLinks) {
            if (downloads >= 20) break;

            try {
                const fileRes = await fetch(item.dlUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
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
                    } else {
                        console.log(`   ❌ No L+M found inside ${item.filename}`);
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
