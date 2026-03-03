// src/app/api/admin/scrape-sam/route.ts
// Fixed: Detect HTML-as-PDF, better content inspection, skip non-PDF gracefully
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

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchSafe(url: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.status === 429 || res.status === 503) { await delay(3000 * Math.pow(2, i)); continue; }
            return res;
        } catch (err) { if (i === retries - 1) throw err; await delay(2000); }
    }
    throw new Error('API exhausted');
}

function ensureDir() { if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true }); }
function loadSeen(): string[] { ensureDir(); try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch { return []; } }
function saveSeen(list: string[]) { fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2)); }

interface CachedOpp { noticeId: string; title: string; solicitationNumber: string; resourceLinks: string[]; }
function loadCache(): CachedOpp[] {
    ensureDir();
    try {
        const d = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        if (d.timestamp && (Date.now() - d.timestamp) < 24 * 3600000) return d.opportunities || [];
    } catch { }
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
        const past = new Date(today); past.setDate(past.getDate() - lookbackDays);
        const postedFrom = `${(past.getMonth() + 1).toString().padStart(2, '0')}/${past.getDate().toString().padStart(2, '0')}/${past.getFullYear()}`;

        const stream = new ReadableStream({
            async start(controller) {
                const sendJSON = (data: Record<string, unknown>) => {
                    controller.enqueue(typeof data === 'string' ? data : JSON.stringify(data) + '\n');
                };

                const seenList = loadSeen();
                sendJSON({ type: 'log', message: `🔍 SAM.gov API | Seen: ${seenList.length} | NAICS: ${naicsCodes.length}` });

                let opps = loadCache();

                if (opps.length > 0) {
                    sendJSON({ type: 'log', message: `📦 Cached: ${opps.length} opps (<24h)` });
                } else {
                    // Query first 2 NAICS codes individually (10/day limit)
                    const codes = naicsCodes.slice(0, 2);
                    sendJSON({ type: 'log', message: `📡 Querying ${codes.length} NAICS codes...` });

                    for (const code of codes) {
                        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=100&ncode=${code}&postedFrom=${postedFrom}&postedTo=${postedTo}`;
                        try {
                            const res = await fetchSafe(url);
                            if (!res.ok) {
                                sendJSON({ type: 'log', message: `  ⚠️ NAICS ${code}: HTTP ${res.status}` });
                                if (res.status === 503 || res.status === 429) break;
                                continue;
                            }
                            const data = await res.json();
                            const items = data.opportunitiesData || [];
                            sendJSON({ type: 'log', message: `  NAICS ${code}: ${items.length} found` });
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            opps = opps.concat(items.map((o: any) => ({
                                noticeId: o.noticeId || '', title: o.title || '',
                                solicitationNumber: o.solicitationNumber || '',
                                resourceLinks: o.resourceLinks || [],
                            })));
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `  ❌ NAICS ${code}: ${(err as Error).message}` });
                        }
                        await delay(1000);
                    }
                    // Dedup
                    const ids = new Set<string>();
                    opps = opps.filter(o => { if (!o.noticeId || ids.has(o.noticeId)) return false; ids.add(o.noticeId); return true; });
                    if (opps.length > 0) saveCache(opps);
                    sendJSON({ type: 'log', message: `💾 Total: ${opps.length} unique opps` });
                }

                const candidates = opps
                    .filter(o => o.noticeId && !seenList.includes(o.noticeId) && o.resourceLinks.length > 0)
                    .sort((a, b) => b.resourceLinks.length - a.resourceLinks.length);

                sendJSON({ type: 'log', message: `📋 ${candidates.length} unseen with links` });

                let downloads = 0;
                let checked = 0;

                for (const opp of candidates) {
                    if (downloads >= 5 || checked >= 15) break;
                    checked++;
                    sendJSON({ type: 'log', message: `\n🔎 [${checked}/${candidates.length}] ${opp.title.substring(0, 60)}` });
                    sendJSON({ type: 'log', message: `   ${opp.resourceLinks.length} attachment links` });

                    for (const link of opp.resourceLinks) {
                        if (downloads >= 5) break;
                        await delay(1500);

                        try {
                            const dlUrl = link.includes('api_key=') ? link : `${link}${link.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
                            sendJSON({ type: 'log', message: `   📥 Downloading...` });
                            const fileRes = await fetchSafe(dlUrl);

                            if (!fileRes.ok) {
                                sendJSON({ type: 'log', message: `   ⚠️ HTTP ${fileRes.status}` });
                                if (fileRes.status === 503 || fileRes.status === 429) { checked = 999; break; }
                                continue;
                            }

                            // Check Content-Type header first
                            const ct = fileRes.headers.get('content-type') || '';
                            const cd = fileRes.headers.get('content-disposition') || '';
                            const filename = cd.split('filename=')[1]?.replace(/"/g, '').trim() || '';

                            const arrayBuffer = await fileRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            if (buffer.length < 1000) { continue; }
                            if (buffer.length > 50 * 1024 * 1024) { continue; }

                            // Check magic bytes: real PDFs start with %PDF
                            const header = buffer.slice(0, 10).toString('ascii');
                            const isPdf = header.startsWith('%PDF');
                            const isHtml = header.includes('<') || header.includes('<!') || header.includes('<?xml');

                            if (isHtml) {
                                // SAM.gov returned an HTML error page instead of the actual file
                                const htmlSnippet = buffer.slice(0, 200).toString('utf8');
                                if (htmlSnippet.includes('Access Denied') || htmlSnippet.includes('Forbidden')) {
                                    sendJSON({ type: 'log', message: `   🔒 Access Denied (auth required)` });
                                } else {
                                    sendJSON({ type: 'log', message: `   ⚠️ Got HTML, not PDF (SAM.gov error page)` });
                                }
                                continue;
                            }

                            const ext = filename.split('.').pop()?.toLowerCase() || '';
                            if (['zip', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'gif', 'msg', 'pptx'].includes(ext)) {
                                sendJSON({ type: 'log', message: `   ⏭️ ${ext.toUpperCase()}: ${filename}` });
                                continue;
                            }

                            if (!isPdf && !ct.includes('pdf')) {
                                sendJSON({ type: 'log', message: `   ⏭️ Not PDF (${ct || 'unknown type'}, header: "${header.substring(0, 5)}")` });
                                continue;
                            }

                            sendJSON({ type: 'log', message: `   📄 ${filename || 'file'} (${(buffer.length / 1024).toFixed(0)}KB) ✓ PDF` });

                            let text = '';
                            try {
                                const parsed = await pdfParse(buffer);
                                text = parsed.text.toLowerCase();
                            } catch {
                                // Try saving anyway — might be encrypted/protected but still valid
                                sendJSON({ type: 'log', message: `   ⚠️ Protected/encrypted PDF — saving anyway` });
                                const safeName = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}.pdf`;
                                fs.writeFileSync(path.join(SAMPLES_DIR, safeName), buffer);
                                sendJSON({ type: 'log', message: `   💾 ${safeName} (needs manual review)` });
                                continue;
                            }

                            if (text.length < 100) {
                                sendJSON({ type: 'log', message: `   ⏭️ Scanned image PDF (${text.length} chars)` });
                                continue;
                            }

                            const matched = keywords.filter(kw => text.includes(kw));
                            if (matched.length > 0) {
                                const safeName = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}_${downloads}.pdf`;
                                fs.writeFileSync(path.join(SAMPLES_DIR, safeName), buffer);
                                sendJSON({ type: 'log', message: `   ✅ MATCH! "${matched.join('", "')}"` });
                                sendJSON({ type: 'log', message: `   💾 ${safeName}` });
                                sendJSON({ type: 'result', match: { oppTitle: opp.title, solicitation: opp.solicitationNumber, link, filename: safeName } });
                                downloads++;
                            } else {
                                sendJSON({ type: 'log', message: `   ❌ No keywords (${(text.length / 1000).toFixed(0)}k chars scanned)` });
                            }
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `   ⚠️ ${(err as Error).message}` });
                        }
                    }
                    seenList.push(opp.noticeId);
                    saveSeen(seenList);
                }

                sendJSON({ type: 'log', message: `\n🏁 ${checked} checked, ${downloads} saved.` });
                sendJSON({ type: 'done', count: downloads });
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
