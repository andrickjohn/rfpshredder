// src/app/api/admin/scrape-sam/route.ts
// Fixed: ZIP extraction, attachment metadata API, proper content detection
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const JSZip = require('jszip');

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

// Extract PDFs from a ZIP buffer
async function extractPdfsFromZip(zipBuffer: Buffer): Promise<{ name: string, buffer: Buffer }[]> {
    const pdfs: { name: string, buffer: Buffer }[] = [];
    try {
        const zip = await JSZip.loadAsync(zipBuffer);
        for (const [filename, file] of Object.entries(zip.files)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const f = file as any;
            if (f.dir) continue;
            const lower = filename.toLowerCase();
            if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx')) {
                const buf = await f.async('nodebuffer');
                if (buf.length > 1000) {
                    pdfs.push({ name: filename, buffer: buf });
                }
            }
        }
    } catch { /* not a valid zip */ }
    return pdfs;
}

// Check keywords in a PDF buffer
async function checkPdfKeywords(buffer: Buffer, keywords: string[]): Promise<string[]> {
    try {
        const parsed = await pdfParse(buffer);
        const text = parsed.text.toLowerCase();
        if (text.length < 100) return [];
        return keywords.filter(kw => text.includes(kw));
    } catch {
        return [];
    }
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
                const send = (data: Record<string, unknown>) => {
                    controller.enqueue(typeof data === 'string' ? data : JSON.stringify(data) + '\n');
                };

                const seenList = loadSeen();
                send({ type: 'log', message: `🔍 SAM.gov API | Seen: ${seenList.length} | NAICS: ${naicsCodes.length}` });

                let opps = loadCache();

                if (opps.length > 0) {
                    send({ type: 'log', message: `📦 Cached: ${opps.length} opps` });
                } else {
                    const codes = naicsCodes.slice(0, 2);
                    send({ type: 'log', message: `📡 Querying ${codes.length} NAICS...` });

                    for (const code of codes) {
                        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=100&ncode=${code}&postedFrom=${postedFrom}&postedTo=${postedTo}`;
                        try {
                            const res = await fetchSafe(url);
                            if (!res.ok) {
                                send({ type: 'log', message: `  ⚠️ NAICS ${code}: HTTP ${res.status}` });
                                if (res.status === 503 || res.status === 429) break;
                                continue;
                            }
                            const data = await res.json();
                            const items = data.opportunitiesData || [];
                            send({ type: 'log', message: `  NAICS ${code}: ${items.length} opps` });
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            opps = opps.concat(items.map((o: any) => ({
                                noticeId: o.noticeId || '', title: o.title || '',
                                solicitationNumber: o.solicitationNumber || '',
                                resourceLinks: o.resourceLinks || [],
                            })));
                        } catch (err: unknown) {
                            send({ type: 'log', message: `  ❌ ${(err as Error).message}` });
                        }
                        await delay(1000);
                    }
                    const ids = new Set<string>();
                    opps = opps.filter(o => { if (!o.noticeId || ids.has(o.noticeId)) return false; ids.add(o.noticeId); return true; });
                    if (opps.length > 0) saveCache(opps);
                    send({ type: 'log', message: `💾 ${opps.length} unique opps` });
                }

                const candidates = opps.filter(o => o.noticeId && !seenList.includes(o.noticeId) && o.resourceLinks.length > 0)
                    .sort((a, b) => b.resourceLinks.length - a.resourceLinks.length);
                send({ type: 'log', message: `📋 ${candidates.length} unseen with attachments` });

                let downloads = 0;
                let checked = 0;

                for (const opp of candidates) {
                    if (downloads >= 5 || checked >= 15) break;
                    checked++;
                    send({ type: 'log', message: `\n🔎 [${checked}/${candidates.length}] ${opp.title.substring(0, 50)}` });
                    send({ type: 'log', message: `   ${opp.resourceLinks.length} links | Sol: ${opp.solicitationNumber}` });

                    for (const link of opp.resourceLinks) {
                        if (downloads >= 5) break;
                        await delay(1500);

                        try {
                            const dlUrl = link.includes('api_key=') ? link : `${link}${link.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
                            send({ type: 'log', message: `   📥 Fetching...` });
                            const fileRes = await fetchSafe(dlUrl);

                            if (!fileRes.ok) {
                                send({ type: 'log', message: `   ⚠️ HTTP ${fileRes.status}` });
                                if (fileRes.status === 503 || fileRes.status === 429) { checked = 999; break; }
                                continue;
                            }

                            const arrayBuffer = await fileRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            if (buffer.length < 1000) continue;

                            const header = buffer.slice(0, 5).toString('ascii');
                            const cd = fileRes.headers.get('content-disposition') || '';
                            const filename = cd.split('filename=')[1]?.replace(/"/g, '').trim() || '';

                            // Handle ZIP files — extract PDFs from inside
                            if (header.startsWith('PK')) {
                                send({ type: 'log', message: `   📦 ZIP archive (${(buffer.length / 1024).toFixed(0)}KB) — extracting...` });
                                const pdfs = await extractPdfsFromZip(buffer);
                                send({ type: 'log', message: `   📄 Found ${pdfs.length} documents inside ZIP` });

                                for (const pdf of pdfs) {
                                    if (downloads >= 5) break;
                                    send({ type: 'log', message: `   📄 ${pdf.name} (${(pdf.buffer.length / 1024).toFixed(0)}KB)` });

                                    const matched = await checkPdfKeywords(pdf.buffer, keywords);
                                    if (matched.length > 0) {
                                        const safeName = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}_${downloads}.pdf`;
                                        fs.writeFileSync(path.join(SAMPLES_DIR, safeName), pdf.buffer);
                                        send({ type: 'log', message: `   ✅ MATCH! "${matched.join('", "')}"` });
                                        send({ type: 'log', message: `   💾 ${safeName}` });
                                        send({ type: 'result', match: { oppTitle: opp.title, solicitation: opp.solicitationNumber, link, filename: safeName } });
                                        downloads++;
                                    } else {
                                        send({ type: 'log', message: `   ❌ No keywords in ${pdf.name}` });
                                    }
                                }
                                continue;
                            }

                            // Handle HTML error pages
                            if (header.includes('<') || header.includes('<!')) {
                                const snippet = buffer.slice(0, 200).toString('utf8');
                                if (snippet.includes('Access Denied') || snippet.includes('Forbidden')) {
                                    send({ type: 'log', message: `   🔒 Access Denied` });
                                } else {
                                    send({ type: 'log', message: `   ⚠️ HTML response (not a file)` });
                                }
                                continue;
                            }

                            // Handle actual PDFs
                            if (header.startsWith('%PDF')) {
                                send({ type: 'log', message: `   📄 ${filename || 'file'} (${(buffer.length / 1024).toFixed(0)}KB) ✓ PDF` });
                                const matched = await checkPdfKeywords(buffer, keywords);
                                if (matched.length > 0) {
                                    const safeName = `SAM_API_${opp.solicitationNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}_${downloads}.pdf`;
                                    fs.writeFileSync(path.join(SAMPLES_DIR, safeName), buffer);
                                    send({ type: 'log', message: `   ✅ MATCH! "${matched.join('", "')}"` });
                                    send({ type: 'result', match: { oppTitle: opp.title, solicitation: opp.solicitationNumber, link, filename: safeName } });
                                    downloads++;
                                } else {
                                    send({ type: 'log', message: `   ❌ No keywords` });
                                }
                            } else {
                                send({ type: 'log', message: `   ⏭️ Unknown format (header: "${header}")` });
                            }
                        } catch (err: unknown) {
                            send({ type: 'log', message: `   ⚠️ ${(err as Error).message}` });
                        }
                    }
                    seenList.push(opp.noticeId);
                    saveSeen(seenList);
                }

                send({ type: 'log', message: `\n🏁 ${checked} checked, ${downloads} saved.` });
                send({ type: 'done', count: downloads });
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
