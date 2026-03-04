const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'sam_samples');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const L_PATS = ['section l', 'part l', 'instructions to offerors', 'proposal instructions'];
const M_PATS = ['section m', 'part m', 'evaluation criteria', 'evaluation factors', 'basis for award'];

function checkPdfForLM(filepath) {
    try {
        const text = execSync(`strings "${filepath}" 2>/dev/null`, { maxBuffer: 10 * 1024 * 1024 }).toString().toLowerCase();
        const matchedL = L_PATS.filter(p => text.includes(p));
        const matchedM = M_PATS.filter(p => text.includes(p));
        return { match: matchedL.length > 0 && matchedM.length > 0, matchedL, matchedM, chars: text.length };
    } catch { return { match: false, matchedL: [], matchedM: [], chars: 0 }; }
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// SAM.gov opp IDs extracted from search results
const OPP_IDS = [
    '1b8b3cc0626c4545bedfd24514b3ad1f', // COSMOS
    'e416b59a80194137b5730a617260b58d', // KC-135
    'afc069fb06374f2580184db9097b161d', // PUMP UNIT
    '6264ebecf05542aba1aa587dcd31e28f', // SAFE 44 Foot 
    '27a126ed6f3146cba24b6d88ce68aa68', // Survivability Test Stand
    '4f3a8f39c18f47febe01af436fd66142', // ASDE Tower
    'e89e9b9e45664bce9c52d4bed81018c0', // ISMUG
    '633ff34982b7413ebcfa9ba7f4a7c29d', // NGAME
    '94b256aceee84bf0908f3200f2a55360', // Indo-Pacific
    '50f08967de48443398f566453716637e', // Firetruck
];

async function main() {
    let saved = 0;
    const TARGET = 5;

    for (const oppId of OPP_IDS) {
        if (saved >= TARGET) break;
        console.log(`\n🔎 Opp: ${oppId}`);

        // Get opportunity details via SAM internal API
        const apiUrl = `https://sam.gov/api/prod/opps/v3/opportunities/${oppId}?random=${Date.now()}`;
        await delay(2000);

        try {
            const res = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'application/json',
                }
            });
            if (!res.ok) { console.log(`  ⚠️ HTTP ${res.status}`); continue; }
            const data = await res.json();
            const title = data.data?.title || data.title || '?';
            console.log(`  📋 ${title.substring(0, 60)}`);

            // Find resource links
            const links = data.data?.resourceLinks || data.resourceLinks || [];
            // Also check pointOfContact and attachments
            const attachments = data.data?.attachments || data.attachments || [];
            console.log(`  📎 ${links.length} resourceLinks, ${attachments.length} attachments`);

            // Try to download each link that looks like a file
            const allLinks = [...links];
            for (const att of attachments) {
                if (att.resourceId || att.url) {
                    const attUrl = att.url || `https://sam.gov/api/prod/opps/v3/opportunities/resources/files/${att.resourceId}/download`;
                    allLinks.push(attUrl);
                }
            }

            for (let i = 0; i < Math.min(allLinks.length, 6); i++) {
                if (saved >= TARGET) break;
                let url = allLinks[i];
                if (typeof url !== 'string') continue;

                // Skip non-download URLs
                if (!url.includes('download') && !url.includes('.pdf')) continue;

                console.log(`  📥 Link ${i + 1}: ${url.substring(0, 80)}...`);
                await delay(1500);

                try {
                    const dlRes = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
                        redirect: 'follow',
                    });
                    if (!dlRes.ok) { console.log(`    ⚠️ HTTP ${dlRes.status}`); continue; }
                    const buf = Buffer.from(await dlRes.arrayBuffer());
                    if (buf.length < 2000) continue;

                    const header = buf.slice(0, 5).toString('ascii');
                    if (!header.startsWith('%PDF')) { console.log(`    ⏭️ Not PDF (${header.substring(0, 4)})`); continue; }

                    // Save temp and check
                    const tmpFile = path.join(OUTPUT_DIR, `_tmp_${oppId}_${i}.pdf`);
                    fs.writeFileSync(tmpFile, buf);
                    const det = checkPdfForLM(tmpFile);

                    if (det.match) {
                        const safeName = `SAM_LM_${oppId.substring(0, 8)}_${saved + 1}.pdf`;
                        fs.renameSync(tmpFile, path.join(OUTPUT_DIR, safeName));
                        console.log(`    ✅ MATCH! L:[${det.matchedL.join(', ')}] M:[${det.matchedM.join(', ')}]`);
                        console.log(`    💾 ${safeName} (${(buf.length / 1024).toFixed(0)}KB)`);
                        saved++;
                        break;
                    } else {
                        console.log(`    ❌ ${(buf.length / 1024).toFixed(0)}KB — L:${det.matchedL.length} M:${det.matchedM.length} (${det.chars} chars extracted)`);
                        fs.unlinkSync(tmpFile);
                    }
                } catch (err) {
                    console.log(`    ⚠️ ${err.message.substring(0, 60)}`);
                }
            }
        } catch (err) {
            console.log(`  ❌ ${err.message.substring(0, 60)}`);
        }
    }

    console.log(`\n🏁 Found ${saved}/${TARGET} L+M PDFs in ${OUTPUT_DIR}`);
}

main().catch(console.error);
