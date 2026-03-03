// src/app/api/admin/scrape-sam/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_KEY = process.env.SAM_GOV_API_KEY || 'SAM-0fbe5a1c-7d31-4f8e-896d-3d9a1dbd8800';

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, options = {}, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        const res = await fetch(url, options);
        if (res.status === 429) {
            await delay(backoff);
            backoff *= 2;
            continue;
        }
        return res;
    }
    throw new Error('Too Many Requests limit exceeded');
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== 'admin@automatemomentum.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let body = {};
        try {
            body = await req.json();
        } catch {
            // body is optional
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const naicsCodes: string[] = (body as any).naicsCodes || ['541511', '541512', '541519', '511210', '236220'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const keywords: string[] = (body as any).keywords || ['section l', 'section m', 'schedule l', 'schedule m'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lookbackDays: number = (body as any).lookbackDays || 90;

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

                sendJSON({ type: 'log', message: `Searching SAM.gov from ${postedFrom} to ${postedTo}...` });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let opps: any[] = [];

                for (const code of naicsCodes) {
                    sendJSON({ type: 'log', message: `Querying NAICS: ${code}` });
                    const searchUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&limit=30&ncode=${code}&postedFrom=${postedFrom}&postedTo=${postedTo}`;

                    try {
                        const res = await fetchWithBackoff(searchUrl);
                        if (!res.ok) {
                            sendJSON({ type: 'log', message: `API Error for ${code}: ${res.statusText}` });
                            continue;
                        }
                        const data = await res.json();
                        if (data.opportunitiesData) {
                            opps = opps.concat(data.opportunitiesData);
                            sendJSON({ type: 'log', message: `  -> Found ${data.opportunitiesData.length} records` });
                        }
                    } catch (err: unknown) {
                        sendJSON({ type: 'log', message: `Fetch err for ${code}: ${(err as Error).message}` });
                    }
                    await delay(500);
                }

                const smallBizOpps = opps.filter(o => {
                    const desc = o.typeOfSetAsideDescription ? String(o.typeOfSetAsideDescription).toLowerCase() : '';
                    const setAside = o.typeOfSetAside ? String(o.typeOfSetAside).toLowerCase() : '';
                    return desc.includes('small business') || setAside.includes('sba') || setAside.includes('sdb') || setAside.includes('sbe');
                });

                sendJSON({ type: 'log', message: `Filtered to ${smallBizOpps.length} small business opportunities.` });

                let successfulDownloads = 0;

                for (const opp of smallBizOpps) {
                    if (successfulDownloads >= 3) break;
                    if (!opp.resourceLinks || opp.resourceLinks.length === 0) continue;

                    sendJSON({ type: 'log', message: `\nChecking: ${opp.title} (${opp.solicitationNumber})` });

                    for (const link of opp.resourceLinks) {
                        await delay(1000); // SAM limit

                        try {
                            const downloadUrl = link.includes('api_key=') ? link : `${link}?api_key=${API_KEY}`;
                            const headRes = await fetchWithBackoff(downloadUrl, { method: 'HEAD' });
                            const contentDisp = headRes.headers.get('content-disposition') || '';

                            if (contentDisp && !contentDisp.toLowerCase().includes('.pdf') && contentDisp.includes('.')) {
                                continue;
                            }

                            sendJSON({ type: 'log', message: `  Downloading attachment...` });
                            const fileRes = await fetchWithBackoff(downloadUrl);
                            if (!fileRes.ok) continue;

                            const arrayBuffer = await fileRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            let text = '';
                            try {
                                const parsed = await pdfParse(buffer);
                                text = parsed.text.toLowerCase();
                            } catch {
                                sendJSON({ type: 'log', message: `  ❌ Invalid format (not PDF or encrypted).` });
                                continue;
                            }

                            if (keywords.some(kw => text.includes(kw))) {
                                sendJSON({ type: 'log', message: `  ✅ FOUND: Section L/M keywords match!` });
                                const docName = contentDisp ? contentDisp.split('filename="')[1]?.split('"')[0] : 'document.pdf';
                                sendJSON({
                                    type: 'result',
                                    match: {
                                        oppTitle: opp.title,
                                        solicitation: opp.solicitationNumber,
                                        link: downloadUrl,
                                        filename: docName
                                    }
                                });
                                successfulDownloads++;
                                break;
                            } else {
                                sendJSON({ type: 'log', message: `  ❌ Checked PDF: No L/M found.` });
                            }
                        } catch (err: unknown) {
                            sendJSON({ type: 'log', message: `  ⚠️ Attachment error: ${(err as Error).message}` });
                        }
                    }
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
