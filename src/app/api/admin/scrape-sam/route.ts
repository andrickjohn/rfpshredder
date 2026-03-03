// src/app/api/admin/scrape-sam/route.ts
// Fixed: Individual NAICS queries, proper caching, broader search
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

async function fetchSafe(url: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.status === 429 || res.status === 503) {
                await delay(3000 * Math.pow(2, i));
                continue;
            }
            return res;
        } catch (err) {
            if (i === retries - 1) throw err;
            await delay(2000);
        }
    }
    throw new Error('API limit exceeded');
}

function ensureDir() { if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true }); }
function loadSeen(): string[] { ensureDir(); try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { return []; } }
function saveSeen(list: string[]) { fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2)); }

interface CachedOpp {
    noticeId: string;
    title: string;
    solicitationNumber: string;
    resourceLinks: string[];
    typeOfSetAsideDescription?: string;
}

function loadCache(): { opps: CachedOpp[], fresh: boolean } {
    ensureDir();
    try {
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        if (data.timestamp && (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000) {
            return { opps: data.opportunities || [], fresh: true };
        }
    } catch { }
    return { opps: [], fresh: false };
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
                    controller.enqueue(typeof data === 'string' ? data : JSON.stringify(data) + '\n');
                };

                const seenList = loadSeen();
                sendJSON({ type: 'log', message: `🔍 SAM.gov API Scraper` });
                sendJSON({ type: 'log', message: `📊 Seen: ${seenList.length} | Keywords: ${keywords.length} | NAICS: ${naicsCodes.length}` });

                // Check cache first
                const cache = loadCache();
                let opps: CachedOpp[] = [];

                if (cache.fresh && cache.opps.length > 0) {
                    opps = cache.opps;
                    sendJSON({ type: 'log', message: `📦 Using cached data (${opps.length} opps, <24h)` });
                } else {
                    // INDIVIDUAL queries per NAICS code (comma-separated not supported!)
                    // Use only first 2 NAICS to stay under 10 req/day limit
                    const codesToQuery = naicsCodes.slice(0, 2);
                    sendJSON({ type: 'log', message: `📡 Querying ${codesToQuery.length} NAICS codes (10/day API limit)...` });

                    for (const code of codesToQuery) {
                        sendJSON({ type: 'log', message: `\n  NAICS ${code}...` });
                        // Don't filter by ptype — get ALL types to maximize results
                        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=100&ncode=${code}&postedFrom=${postedFrom}&postedTo=${postedTo}`;

                        try {
                            const res = await fetchSafe(url);
                            if (!res.ok) {
                                sendJSON({ type: 'log', message: `  ⚠️ ${res.status}: ${res.statusText}` });
                                if (res.status === 503 || res.status === 429) {
                                    sendJSON({ type: 'log', message: `  💡 API limit hit. Try again tomorrow or use Browser Engine.` });
                                    break;
                                }
                                continue;
                            }
                            const data = await res.json();
                            const items = data.opportunitiesData || [];
                            sendJSON({ type: 'log', message: `  → ${items.length} found` });
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            opps = opps.concat(items.map((o: any) => ({
                                noticeId: o.noticeId || '',
                                title: o.title || '',
                                solicitationNumber: o.solicitationNumber || '',
                                resourceLinks: o.resourceLinks || [],
                                typeOfSetAsideDescription: o.typeOfSetAsideDescription || ''
                            })));
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `  ❌ ${(err as Error).message}` });
                        }
                        await delay(1000);
                    }

                    // Deduplicate by noticeId
                    const seen = new Set<string>();
                    opps = opps.filter(o => { if (!o.noticeId || seen.has(o.noticeId)) return false; seen.add(o.noticeId); return true; });

                    if (opps.length > 0) {
                        saveCache(opps);
                        sendJSON({ type: 'log', message: `💾 Cached ${opps.length} opps for 24h` });
                    }
                }

                // Filter to unseen with attachments, sort by most links first
                const candidates = opps
                    .filter(o => o.noticeId && !seenList.includes(o.noticeId) && o.resourceLinks.length > 0)
                    .sort((a, b) => b.resourceLinks.length - a.resourceLinks.length);

                sendJSON({ type: 'log', message: `\n📋 ${candidates.length} unseen with attachments (of ${opps.length})` });

                if (candidates.length === 0) {
                    sendJSON({ type: 'log', message: `💡 Delete sam_samples/opp_cache.json and seen_solicitations.json to start fresh` });
                }

                let successfulDownloads = 0;
                let checked = 0;

                for (const opp of candidates) {
                    if (successfulDownloads >= 3 || checked >= 10) break;
                    checked++;

                    sendJSON({ type: 'log', message: `\n🔎 [${checked}] ${opp.title}` });
                    sendJSON({ type: 'log', message: `   Sol: ${opp.solicitationNumber} | ${opp.resourceLinks.length} links` });

                    // Try ALL resource links for this opportunity
                    for (const link of opp.resourceLinks) {
                        if (successfulDownloads >= 3) break;
                        await delay(2000);

                        try {
                            const downloadUrl = link.includes('api_key=') ? link : `${link}${link.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
                            sendJSON({ type: 'log', message: `   📥 Downloading...` });
                            const fileRes = await fetchSafe(downloadUrl);

                            if (!fileRes.ok) {
                                if (fileRes.status === 503 || fileRes.status === 429) { checked = 999; break; }
                                continue;
                            }

                            const contentDisp = fileRes.headers.get('content-disposition') || '';
                            const filename = contentDisp.split('filename=')[1]?.replace(/"/g, '').trim() || '';
                            const ext = filename.split('.').pop()?.toLowerCase() || '';

                            if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif', 'msg', 'pptx'].includes(ext)) {
                                sendJSON({ type: 'log', message: `   ⏭️ ${ext.toUpperCase()}: ${filename}` });
                                continue;
                            }

                            const arrayBuffer = await fileRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            if (buffer.length < 5000 || buffer.length > 50 * 1024 * 1024) continue;

                            sendJSON({ type: 'log', message: `   📄 ${filename || 'file'} (${(buffer.length / 1024).toFixed(0)}KB)` });

                            let text = '';
                            try {
                                const parsed = await pdfParse(buffer);
                                text = parsed.text.toLowerCase();
                            } catch {
                                sendJSON({ type: 'log', message: `   ❌ Not a readable PDF` });
                                continue;
                            }

                            if (text.length < 200) { sendJSON({ type: 'log', message: `   ⏭️ Scanned/image PDF` }); continue; }

                            const matched = keywords.filter(kw => text.includes(kw));
                            if (matched.length > 0) {
                                const safeName = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}.pdf`;
                                fs.writeFileSync(path.join(SAMPLES_DIR, safeName), buffer);
                                sendJSON({ type: 'log', message: `   ✅ MATCH! "${matched.join('", "')}"` });
                                sendJSON({ type: 'log', message: `   💾 ${safeName}` });
                                sendJSON({ type: 'result', match: { oppTitle: opp.title, solicitation: opp.solicitationNumber, link, filename: safeName } });
                                successfulDownloads++;
                            } else {
                                sendJSON({ type: 'log', message: `   ❌ No keyword matches in ${(text.length / 1000).toFixed(0)}k chars` });
                            }
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `   ⚠️ ${(err as Error).message}` });
                        }
                    }
                    seenList.push(opp.noticeId);
                    saveSeen(seenList);
                }

                sendJSON({ type: 'log', message: `\n🏁 Done. ${checked} checked, ${successfulDownloads} matched.` });
                sendJSON({ type: 'done', count: successfulDownloads });
                controller.close();
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
