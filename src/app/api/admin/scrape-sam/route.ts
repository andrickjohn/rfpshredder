// src/app/api/admin/scrape-sam/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_KEY = process.env.SAM_GOV_API_KEY || 'SAM-0fbe5a1c-7d31-4f8e-896d-3d9a1dbd8800';

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, options = {}, retries = 5, backoff = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status === 429) {
                const wait = backoff * Math.pow(2, i);
                await delay(wait);
                continue;
            }
            return res;
        } catch (err) {
            if (i === retries - 1) throw err;
            await delay(backoff);
        }
    }
    throw new Error('Too Many Requests limit exceeded after retries');
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== 'admin@automatemomentum.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let body: Record<string, unknown> = {};
        try {
            body = await req.json() as Record<string, unknown>;
        } catch {
            // body is optional
        }

        const naicsCodes: string[] = (Array.isArray(body.naicsCodes) ? body.naicsCodes : null) || ['541511', '541512', '541519', '511210', '236220'];
        const keywords: string[] = (Array.isArray(body.keywords) ? body.keywords : null) || [
            'section l', 'section m', 'schedule l', 'schedule m',
            'instructions to offerors', 'evaluation criteria',
            'evaluation factors', 'proposal preparation',
            'proposal instructions', 'technical approach',
            'past performance', 'volume i', 'volume ii'
        ];
        const lookbackDays: number = (typeof body.lookbackDays === 'number' ? body.lookbackDays : null) || 180;

        const today = new Date();
        const postedTo = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
        const past = new Date(today);
        past.setDate(past.getDate() - lookbackDays);
        const postedFrom = `${(past.getMonth() + 1).toString().padStart(2, '0')}/${past.getDate().toString().padStart(2, '0')}/${past.getFullYear()}`;

        const stream = new ReadableStream({
            async start(controller) {
                const samplesDir = path.join(process.cwd(), 'sam_samples');
                const seenFile = path.join(samplesDir, 'seen_solicitations.json');

                if (!fs.existsSync(samplesDir)) {
                    fs.mkdirSync(samplesDir, { recursive: true });
                }

                let seenList: string[] = [];
                if (fs.existsSync(seenFile)) {
                    try { seenList = JSON.parse(fs.readFileSync(seenFile, 'utf8')); } catch { }
                }

                const markAsSeen = (id: string) => {
                    if (!id || seenList.includes(id)) return;
                    seenList.push(id);
                    fs.writeFileSync(seenFile, JSON.stringify(seenList, null, 2));
                };

                const sendJSON = (data: Record<string, unknown>) => {
                    controller.enqueue(typeof data === 'string' ? data : JSON.stringify(data) + '\n');
                };

                sendJSON({ type: 'log', message: `🔍 Searching SAM.gov from ${postedFrom} to ${postedTo}...` });
                sendJSON({ type: 'log', message: `📋 Keywords: ${keywords.join(', ')}` });
                sendJSON({ type: 'log', message: `📊 Already seen: ${seenList.length} opportunities` });

                // Notice types most likely to contain full RFP PDFs with Section L/M
                const noticeTypes = ['k', 'o']; // k=Combined Synopsis/Solicitation, o=Solicitation
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let opps: any[] = [];

                for (const code of naicsCodes) {
                    for (const ptype of noticeTypes) {
                        const ptypeLabel = ptype === 'k' ? 'Combined Synopsis/Solicitation' : 'Solicitation';
                        sendJSON({ type: 'log', message: `\n📡 NAICS ${code} | Type: ${ptypeLabel}` });

                        const searchUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=50&ncode=${code}&ptype=${ptype}&postedFrom=${postedFrom}&postedTo=${postedTo}`;

                        try {
                            const res = await fetchWithBackoff(searchUrl);
                            if (!res.ok) {
                                sendJSON({ type: 'log', message: `  ⚠️ API ${res.status}: ${res.statusText}` });
                                continue;
                            }
                            const data = await res.json();
                            if (data.opportunitiesData) {
                                opps = opps.concat(data.opportunitiesData);
                                sendJSON({ type: 'log', message: `  → ${data.opportunitiesData.length} records found` });
                            } else {
                                sendJSON({ type: 'log', message: `  → 0 records` });
                            }
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `  ❌ Fetch error: ${(err as Error).message}` });
                        }
                        await delay(800);
                    }
                }

                // Deduplicate by noticeId
                const seen = new Set<string>();
                opps = opps.filter(o => {
                    if (!o.noticeId || seen.has(o.noticeId)) return false;
                    seen.add(o.noticeId);
                    return true;
                });

                sendJSON({ type: 'log', message: `\n📊 Total unique opportunities: ${opps.length}` });

                // Don't filter by small business only - check ALL opportunities for PDFs
                // Sort: prefer ones with resourceLinks
                opps.sort((a, b) => {
                    const aLinks = a.resourceLinks?.length ?? 0;
                    const bLinks = b.resourceLinks?.length ?? 0;
                    return bLinks - aLinks;
                });

                let successfulDownloads = 0;
                let checkedCount = 0;

                for (const opp of opps) {
                    if (successfulDownloads >= 3) break;
                    if (checkedCount >= 40) {
                        sendJSON({ type: 'log', message: `\n⏱️ Checked 40 opportunities, stopping to respect rate limits.` });
                        break;
                    }

                    if (seenList.includes(opp.noticeId)) {
                        continue; // silent skip for already-seen
                    }

                    if (!opp.resourceLinks || opp.resourceLinks.length === 0) {
                        markAsSeen(opp.noticeId);
                        continue;
                    }

                    checkedCount++;
                    const setAside = opp.typeOfSetAsideDescription || opp.typeOfSetAside || 'Unrestricted';
                    sendJSON({ type: 'log', message: `\n🔎 [${checkedCount}] ${opp.title}` });
                    sendJSON({ type: 'log', message: `   Sol: ${opp.solicitationNumber} | Set-aside: ${setAside} | Links: ${opp.resourceLinks.length}` });

                    for (const link of opp.resourceLinks) {
                        if (successfulDownloads >= 3) break;
                        await delay(1500);

                        try {
                            const downloadUrl = link.includes('api_key=') ? link : `${link}${link.includes('?') ? '&' : '?'}api_key=${API_KEY}`;

                            sendJSON({ type: 'log', message: `   📥 Downloading attachment...` });
                            const fileRes = await fetchWithBackoff(downloadUrl);
                            if (!fileRes.ok) {
                                sendJSON({ type: 'log', message: `   ⚠️ HTTP ${fileRes.status}` });
                                continue;
                            }

                            const contentType = fileRes.headers.get('content-type') || '';
                            const contentDisp = fileRes.headers.get('content-disposition') || '';
                            const filename = contentDisp.split('filename=')[1]?.replace(/"/g, '') || '';
                            const ext = filename.split('.').pop()?.toLowerCase() || '';

                            // Skip clearly non-document files
                            if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif', 'msg'].includes(ext)) {
                                sendJSON({ type: 'log', message: `   ⏭️ Skipping ${ext.toUpperCase()} file: ${filename}` });
                                continue;
                            }

                            const arrayBuffer = await fileRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            // Check file size - skip tiny files (<5KB) and huge files (>50MB)
                            if (buffer.length < 5000) {
                                sendJSON({ type: 'log', message: `   ⏭️ Too small (${(buffer.length / 1024).toFixed(1)}KB)` });
                                continue;
                            }
                            if (buffer.length > 50 * 1024 * 1024) {
                                sendJSON({ type: 'log', message: `   ⏭️ Too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB)` });
                                continue;
                            }

                            sendJSON({ type: 'log', message: `   📄 File: ${filename || 'unknown'} (${(buffer.length / 1024).toFixed(0)}KB) [${contentType.split(';')[0]}]` });

                            let text = '';
                            try {
                                const parsed = await pdfParse(buffer);
                                text = parsed.text.toLowerCase();
                            } catch {
                                sendJSON({ type: 'log', message: `   ❌ Not a readable PDF` });
                                continue;
                            }

                            // Check page count
                            const pageCount = text.split(/\f/).length;
                            sendJSON({ type: 'log', message: `   📑 Parsed ${pageCount} pages, ${text.length.toLocaleString()} chars` });

                            if (text.length < 500) {
                                sendJSON({ type: 'log', message: `   ⏭️ Too little text (scanned/image PDF?)` });
                                continue;
                            }

                            const matchedKeywords = keywords.filter(kw => text.includes(kw));
                            if (matchedKeywords.length > 0) {
                                sendJSON({ type: 'log', message: `   ✅ MATCH! Found: "${matchedKeywords.join('", "')}"` });

                                // Save the PDF locally
                                const safeFilename = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}.pdf`;
                                const filepath = path.join(samplesDir, safeFilename);
                                fs.writeFileSync(filepath, buffer);
                                sendJSON({ type: 'log', message: `   💾 Saved: ${safeFilename}` });

                                sendJSON({
                                    type: 'result',
                                    match: {
                                        oppTitle: opp.title,
                                        solicitation: opp.solicitationNumber,
                                        link: downloadUrl,
                                        filename: safeFilename
                                    }
                                });
                                successfulDownloads++;
                                break;
                            } else {
                                sendJSON({ type: 'log', message: `   ❌ No keyword matches in PDF` });
                            }
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `   ⚠️ Error: ${(err as Error).message}` });
                        }
                    }
                    markAsSeen(opp.noticeId);
                }

                sendJSON({ type: 'log', message: `\n🏁 Done. Checked ${checkedCount} opportunities. Found ${successfulDownloads} matching PDFs.` });
                sendJSON({ type: 'done', count: successfulDownloads });
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
