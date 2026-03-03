// src/app/api/admin/scrape-sam-direct/route.ts
// Strategy 3: Direct lookup — paste a SAM.gov URL or solicitation number
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spawn } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== 'admin@automatemomentum.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let body: Record<string, unknown> = {};
        try { body = await req.json() as Record<string, unknown>; } catch { }

        const targetUrl = (typeof body.url === 'string' ? body.url : '').trim();
        const keywords: string[] = (Array.isArray(body.keywords) ? body.keywords : null) || [
            'section l', 'section m', 'schedule l', 'schedule m',
            'instructions to offerors', 'evaluation criteria'
        ];

        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        if (process.env.VERCEL) {
            return NextResponse.json({ error: 'Direct lookup requires local (puppeteer). Run at localhost:3000.' }, { status: 400 });
        }

        const stream = new ReadableStream({
            start(controller) {
                const sendJSON = (data: Record<string, unknown>) => {
                    controller.enqueue(typeof data === 'string' ? data : JSON.stringify(data) + '\n');
                };

                sendJSON({ type: 'log', message: `🎯 Direct Lookup: ${targetUrl}` });
                sendJSON({ type: 'log', message: `Starting browser...` });

                const scriptPath = path.join(process.cwd(), 'scripts', 'scrape-sam-direct.js');
                const child = spawn('node', [scriptPath], {
                    env: {
                        ...process.env,
                        TARGET_URL: targetUrl,
                        TARGET_KEYWORDS: keywords.join(',')
                    }
                });

                child.stdout.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const parsed = JSON.parse(line);
                            sendJSON(parsed);
                            // Forward results properly
                            if (parsed.type === 'result') {
                                // already forwarded as sendJSON
                            }
                        } catch {
                            sendJSON({ type: 'log', message: line.trim() });
                        }
                    }
                });

                child.stderr.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            sendJSON({ type: 'log', message: `⚠️ ${line.trim()}` });
                        }
                    }
                });

                child.on('error', (err) => {
                    sendJSON({ type: 'log', message: `❌ Spawn error: ${err.message}` });
                    sendJSON({ type: 'done', count: 0 });
                    controller.close();
                });

                child.on('close', () => {
                    sendJSON({ type: 'done', count: 0 });
                    controller.close();
                });
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
