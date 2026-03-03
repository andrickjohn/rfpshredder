// src/app/api/admin/scrape-sam/route.ts
// Strategy 1: Consolidated API queries (1-2 calls max) + local cache
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_KEY = process.env.SAM_GOV_API_KEY || '';
const SAMPLES_DIR = path.join(process.cwd(), 'sam_samples');
const SEEN_FILE = path.join(SAMPLES_DIR, 'seen_solicitations.json');
const CACHE_FILE = path.join(SAMPLES_DIR, 'opp_cache.json');

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, retries = 4, backoff = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.status === 429 || res.status === 503) {
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
    throw new Error('API limit exceeded after retries');
}

function ensureDir() {
    if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

function loadSeen(): string[] {
    ensureDir();
    if (fs.existsSync(SEEN_FILE)) {
        try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { }
    }
    return [];
}

function saveSeen(list: string[]) {
    fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2));
}

interface CachedOpp {
    noticeId: string;
    title: string;
    solicitationNumber: string;
    resourceLinks: string[];
    typeOfSetAsideDescription?: string;
    cachedAt: string;
}

function loadCache(): CachedOpp[] {
    ensureDir();
    if (fs.existsSync(CACHE_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            // Cache expires after 24 hours
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            if (data.timestamp && data.timestamp > cutoff) {
                return data.opportunities || [];
            }
        } catch { }
    }
    return [];
}

function saveCache(opps: CachedOpp[]) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), opportunities: opps }, null, 2));
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== 'admin@automatemomentum.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let body: Record<string, unknown> = {};
        try { body = await req.json() as Record<string, unknown>; } catch { }

        const naicsCodes: string[] = (Array.isArray(body.naicsCodes) ? body.naicsCodes : null) || ['541511', '541512', '541519', '511210', '236220'];
        const keywords: string[] = (Array.isArray(body.keywords) ? body.keywords : null) || [
            'section l', 'section m', 'schedule l', 'schedule m',
            'instructions to offerors', 'evaluation criteria',
            'evaluation factors', 'proposal preparation'
        ];
        const lookbackDays: number = (typeof body.lookbackDays === 'number' ? body.lookbackDays : null) || 180;

        const today = new Date();
        const postedTo = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
        const past = new Date(today);
        past.setDate(past.getDate() - lookbackDays);
        const postedFrom = `${(past.getMonth() + 1).toString().padStart(2, '0')}/${past.getDate().toString().padStart(2, '0')}/${past.getFullYear()}`;

        const stream = new ReadableStream({
            async start(controller) {
                const sendJSON = (data: Record<string, unknown>) => {
                    controller.enqueue(JSON.stringify(data) + '\n');
                };

                const seenList = loadSeen();
                sendJSON({ type: 'log', message: `🔍 SAM.gov API Scraper` });
                sendJSON({ type: 'log', message: `📊 Already seen: ${seenList.length} | Keywords: ${keywords.length}` });

                // ---- STEP 1: Get opportunities (from cache or 1 API call) ----
                let opps: CachedOpp[] = loadCache();
                let usedCache = false;

                if (opps.length > 0) {
                    usedCache = true;
                    sendJSON({ type: 'log', message: `📦 Using cached data (${opps.length} opportunities, <24h old)` });
                    sendJSON({ type: 'log', message: `   ℹ️ Delete sam_samples/opp_cache.json to force fresh API search` });
                } else {
                    // SINGLE consolidated API call with all NAICS codes
                    const ncodesParam = naicsCodes.join(',');
                    // Use ptype=k (Combined Synopsis/Solicitation) - highest chance of full RFP PDFs
                    const searchUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=100&ncode=${ncodesParam}&ptype=k&postedFrom=${postedFrom}&postedTo=${postedTo}`;

                    sendJSON({ type: 'log', message: `📡 Searching: NAICS [${ncodesParam}] | Combined Synopsis/Solicitations` });
                    sendJSON({ type: 'log', message: `   Date range: ${postedFrom} → ${postedTo}` });
                    sendJSON({ type: 'log', message: `   ⚡ Using 1 API call (10/day limit)` });

                    try {
                        const res = await fetchWithBackoff(searchUrl);
                        if (!res.ok) {
                            const errText = await res.text().catch(() => res.statusText);
                            sendJSON({ type: 'log', message: `❌ API Error ${res.status}: ${errText.substring(0, 200)}` });

                            if (res.status === 503 || res.status === 429) {
                                sendJSON({ type: 'log', message: `\n💡 TIP: Your API key is limited to 10 requests/day.` });
                                sendJSON({ type: 'log', message: `   Try again tomorrow, or use the Browser Engine instead.` });
                                sendJSON({ type: 'log', message: `   To get 1000 req/day: register entity + request Data Entry role at SAM.gov` });
                            }

                            sendJSON({ type: 'done', count: 0 });
                            controller.close();
                            return;
                        }

                        const data = await res.json();
                        const rawOpps = data.opportunitiesData || [];
                        sendJSON({ type: 'log', message: `   → ${rawOpps.length} opportunities found` });

                        // Cache them for future runs
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        opps = rawOpps.map((o: any) => ({
                            noticeId: o.noticeId || '',
                            title: o.title || '',
                            solicitationNumber: o.solicitationNumber || '',
                            resourceLinks: o.resourceLinks || [],
                            typeOfSetAsideDescription: o.typeOfSetAsideDescription || '',
                            cachedAt: new Date().toISOString()
                        }));
                        saveCache(opps);
                        sendJSON({ type: 'log', message: `💾 Cached ${opps.length} opportunities for 24h reuse` });

                    } catch (err: unknown) {
                        sendJSON({ type: 'log', message: `❌ Fetch error: ${(err as Error).message}` });
                        sendJSON({ type: 'done', count: 0 });
                        controller.close();
                        return;
                    }
                }

                // ---- STEP 2: Filter to unseen opps with resource links ----
                const unseenWithLinks = opps.filter(o =>
                    o.noticeId &&
                    !seenList.includes(o.noticeId) &&
                    o.resourceLinks.length > 0
                );

                sendJSON({ type: 'log', message: `\n📋 ${unseenWithLinks.length} unseen opportunities with attachments (of ${opps.length} total)` });

                if (unseenWithLinks.length === 0 && usedCache) {
                    sendJSON({ type: 'log', message: `\n💡 All cached opportunities already checked!` });
                    sendJSON({ type: 'log', message: `   Delete sam_samples/opp_cache.json to refresh, or try different NAICS codes.` });
                }

                // ---- STEP 3: Download & check PDFs (uses API calls for downloads) ----
                let successfulDownloads = 0;
                let checked = 0;

                for (const opp of unseenWithLinks) {
                    if (successfulDownloads >= 3) break;
                    if (checked >= 15) {
                        sendJSON({ type: 'log', message: `\n⏱️ Checked 15 opportunities, stopping to conserve API calls.` });
                        break;
                    }

                    checked++;
                    sendJSON({ type: 'log', message: `\n🔎 [${checked}/${unseenWithLinks.length}] ${opp.title}` });
                    sendJSON({ type: 'log', message: `   Sol: ${opp.solicitationNumber} | Links: ${opp.resourceLinks.length} | Set-aside: ${opp.typeOfSetAsideDescription || 'None'}` });

                    for (const link of opp.resourceLinks) {
                        if (successfulDownloads >= 3) break;
                        await delay(2000); // Respect rate limits

                        try {
                            const downloadUrl = link.includes('api_key=') ? link : `${link}${link.includes('?') ? '&' : '?'}api_key=${API_KEY}`;

                            sendJSON({ type: 'log', message: `   📥 Downloading...` });
                            const fileRes = await fetchWithBackoff(downloadUrl);

                            if (!fileRes.ok) {
                                sendJSON({ type: 'log', message: `   ⚠️ HTTP ${fileRes.status}` });
                                if (fileRes.status === 503 || fileRes.status === 429) {
                                    sendJSON({ type: 'log', message: `   🛑 Rate limited — stopping downloads.` });
                                    checked = 999; // Break outer loop too
                                }
                                continue;
                            }

                            const contentDisp = fileRes.headers.get('content-disposition') || '';
                            const filename = contentDisp.split('filename=')[1]?.replace(/"/g, '').trim() || '';
                            const ext = filename.split('.').pop()?.toLowerCase() || '';

                            // Skip non-document files
                            if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif', 'msg', 'pptx'].includes(ext)) {
                                sendJSON({ type: 'log', message: `   ⏭️ Skipping ${ext.toUpperCase()}: ${filename}` });
                                continue;
                            }

                            const arrayBuffer = await fileRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            if (buffer.length < 5000 || buffer.length > 50 * 1024 * 1024) {
                                sendJSON({ type: 'log', message: `   ⏭️ Size filter: ${(buffer.length / 1024).toFixed(0)}KB` });
                                continue;
                            }

                            sendJSON({ type: 'log', message: `   📄 ${filename || 'file'} (${(buffer.length / 1024).toFixed(0)}KB)` });

                            let text = '';
                            try {
                                const parsed = await pdfParse(buffer);
                                text = parsed.text.toLowerCase();
                            } catch {
                                sendJSON({ type: 'log', message: `   ❌ Not a readable PDF` });
                                continue;
                            }

                            if (text.length < 500) {
                                sendJSON({ type: 'log', message: `   ⏭️ Scanned/image PDF (too little text)` });
                                continue;
                            }

                            const matched = keywords.filter(kw => text.includes(kw));
                            if (matched.length > 0) {
                                const safeFilename = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}.pdf`;
                                const filepath = path.join(SAMPLES_DIR, safeFilename);
                                fs.writeFileSync(filepath, buffer);

                                sendJSON({ type: 'log', message: `   ✅ MATCH! Keywords: "${matched.join('", "')}"` });
                                sendJSON({ type: 'log', message: `   💾 Saved: ${safeFilename}` });
                                sendJSON({
                                    type: 'result',
                                    match: {
                                        oppTitle: opp.title,
                                        solicitation: opp.solicitationNumber,
                                        link: link,
                                        filename: safeFilename
                                    }
                                });
                                successfulDownloads++;
                                break;
                            } else {
                                sendJSON({ type: 'log', message: `   ❌ No keyword matches` });
                            }
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `   ⚠️ Error: ${(err as Error).message}` });
                        }
                    }

                    seenList.push(opp.noticeId);
                    saveSeen(seenList);
                }

                sendJSON({ type: 'log', message: `\n🏁 Done. Checked ${checked} opps. Found ${successfulDownloads} matching PDFs.` });
                if (successfulDownloads === 0 && checked > 0) {
                    sendJSON({ type: 'log', message: `💡 Tips: Try Shuffle NAICS, increase Lookback Days, or use Browser Engine.` });
                }
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
