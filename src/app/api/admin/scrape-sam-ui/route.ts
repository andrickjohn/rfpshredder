// src/app/api/admin/scrape-sam-ui/route.ts
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
        try {
            body = await req.json() as Record<string, unknown>;
        } catch {
            // body is optional
        }

        const naicsCodes: string[] = (Array.isArray(body.naicsCodes) ? body.naicsCodes : null) || ['541511', '541512', '541519', '511210', '236220'];
        const keywords: string[] = (Array.isArray(body.keywords) ? body.keywords : null) || ['section l', 'section m', 'schedule l', 'schedule m'];

        if (process.env.VERCEL) {
            // Cannot run puppeteer heavy scripts on Vercel easily
            return NextResponse.json({ error: 'This tool uses a headless browser and can only be run locally (localhost:3000), not on Vercel production.' }, { status: 400 });
        }

        const stream = new ReadableStream({
            start(controller) {
                const sendJSON = (data: Record<string, unknown>) => {
                    controller.enqueue(typeof data === 'string' ? data : JSON.stringify(data) + '\n');
                };

                sendJSON({ type: 'log', message: 'Starting Local UI Scraper Process...' });

                const scriptPath = path.join(process.cwd(), 'scripts', 'scrape-sam-ui.js');
                const child = spawn('node', [scriptPath], {
                    env: {
                        ...process.env,
                        TARGET_NAICS: naicsCodes.join(','),
                        TARGET_KEYWORDS: keywords.join(',')
                    }
                });

                child.stdout.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            sendJSON({ type: 'log', message: line.trim() });
                            if (line.includes('✅ FOUND')) {
                                sendJSON({ type: 'result', match: { oppTitle: 'Found via UI', solicitation: 'UI Scrape', link: '#' } });
                            }
                        }
                    }
                });

                child.stderr.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        if (line.trim()) sendJSON({ type: 'log', message: `CMD ERROR: ${line.trim()}` });
                    }
                });

                child.on('close', () => {
                    sendJSON({ type: 'done', count: 0 }); // Count purely visual here
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
