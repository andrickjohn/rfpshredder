// src/app/dashboard/admin/sam-scraper-client.tsx
'use client';

import { useState } from 'react';

type FoundPdf = {
    oppTitle: string;
    solicitation: string;
    link: string;
    filename?: string;
};

export function SamScraperClient() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState<FoundPdf[]>([]);

    const addLog = (msg: string) => {
        setLogs((prev) => [...prev, msg]);
    };

    const startScrape = async () => {
        setLoading(true);
        setLogs([]);
        setResults([]);
        addLog('Starting SAM.gov scraper...');

        try {
            const res = await fetch('/api/admin/scrape-sam', { method: 'POST' });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'log') {
                            addLog(data.message);
                        } else if (data.type === 'result') {
                            setResults((prev) => [...prev, data.match]);
                            addLog(`🎉 MATCH FOUND: ${data.match.solicitation}`);
                        } else if (data.type === 'done') {
                            addLog(`Finished scraping. Found ${data.count} matching PDFs.`);
                        } else if (data.type === 'error') {
                            addLog(`Error: ${data.message}`);
                        }
                    } catch {
                        // Ignore non-json chunks or partial chunks in this simple parser
                    }
                }
            }
        } catch (err: unknown) {
            addLog(`Failed to run scraper: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <button
                onClick={startScrape}
                disabled={loading}
                className="px-4 py-2 bg-[#1B365D] text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#152a48] transition-colors"
            >
                {loading ? 'Scraping...' : 'Find 3 Sample PDFs'}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logs */}
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-96 overflow-y-auto">
                    {logs.length === 0 ? (
                        <span className="text-gray-500">Waiting to start...</span>
                    ) : (
                        logs.map((log, i) => <div key={i}>{log}</div>)
                    )}
                </div>

                {/* Results */}
                <div className="border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
                    <h3 className="font-semibold text-gray-700 mb-4 sticky top-0 bg-gray-50 pb-2 border-b border-gray-200">Found PDFs</h3>
                    {results.length === 0 ? (
                        <p className="text-sm text-gray-500">Matches will appear here...</p>
                    ) : (
                        <div className="space-y-4">
                            {results.map((res, i) => (
                                <div key={i} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                                    <div className="text-sm font-semibold text-gray-900 line-clamp-2" title={res.oppTitle}>
                                        {res.oppTitle}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Sol: {res.solicitation}</div>
                                    <a
                                        href={res.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center text-sm font-medium text-brand-green hover:underline"
                                    >
                                        Download PDF →
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
