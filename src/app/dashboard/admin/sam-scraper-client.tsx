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

    // Filters
    const [naics, setNaics] = useState('541511, 541512, 541519, 511210, 236220');
    const [keywords, setKeywords] = useState('section l, section m, schedule l, schedule m');
    const [lookbackDays, setLookbackDays] = useState('90');

    // History
    type RunHistoryEntry = {
        id: string;
        timestamp: string;
        mode: string;
        filters: string;
        status: string;
    };
    const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);

    const addLog = (msg: string) => {
        setLogs((prev) => [...prev, msg]);
    };

    const startScrape = async (mode: 'api' | 'ui') => {
        setLoading(true);
        setLogs([]);
        setResults([]);

        const endpoint = mode === 'api' ? '/api/admin/scrape-sam' : '/api/admin/scrape-sam-ui';
        addLog(`Starting SAM.gov scraper via ${mode.toUpperCase()} (${endpoint})...`);

        let runStatus = 'Finished';
        let foundCount = 0;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    naicsCodes: naics.split(',').map(s => s.trim()).filter(Boolean),
                    keywords: keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
                    lookbackDays: parseInt(lookbackDays) || 90
                })
            });

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
                            foundCount = data.count || foundCount;
                            addLog(`Finished scraping. Found ${data.count} matching PDFs.`);
                        } else if (data.type === 'error') {
                            runStatus = 'Error';
                            addLog(`Error: ${data.message}`);
                        }
                    } catch {
                        // Ignore non-json chunks or partial chunks in this simple parser
                    }
                }
            }
        } catch (err: unknown) {
            runStatus = 'Failed';
            addLog(`Failed to run scraper: ${(err as Error).message}`);
        } finally {
            setLoading(false);
            setRunHistory(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString(),
                mode: mode.toUpperCase(),
                filters: `NAICS: ${naics} | Days: ${lookbackDays} | Keywords: ${keywords}`,
                status: `${runStatus} (${foundCount} found)`
            }, ...prev]);
        }
    };

    return (
        <div className="space-y-8">

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NAICS Codes (comma prep)</label>
                    <input
                        type="text"
                        value={naics}
                        onChange={e => setNaics(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Keywords</label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lookback Days</label>
                    <input
                        type="number"
                        value={lookbackDays}
                        onChange={e => setLookbackDays(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <button
                    onClick={() => startScrape('api')}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-[#1B365D] text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#152a48] transition-colors"
                >
                    {loading ? 'Scraping...' : 'Mode: SAM API Scraper'}
                </button>
                <div className="text-sm text-gray-500 text-center sm:text-left">
                    <strong>Standard API:</strong> Uses your <code>SAM_GOV_API_KEY</code>. Reliable but subject to extreme 429 Rate Limits from SAM.gov.
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                <button
                    onClick={() => startScrape('ui')}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                >
                    {loading ? 'Scraping...' : 'Mode: Local UI Navigator'}
                </button>
                <div className="text-sm text-gray-500 text-center sm:text-left">
                    <strong>Browser Engine:</strong> Bypasses API limits by launching a hidden Chrome window and clicking links like a human.
                    <span className="block mt-1 text-purple-700 font-medium">⚠️ Only works when running RFP Shredder locally (localhost:3000), not on Vercel.</span>
                </div>
            </div>

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

            {/* Run History */}
            <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Run History</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col max-h-60 overflow-y-auto shadow-inner">
                    {runHistory.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">No runs recorded yet in this session.</div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {runHistory.map(run => (
                                <li key={run.id} className="p-3 text-sm hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 font-mono text-xs">{run.timestamp}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${run.mode === 'API' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {run.mode}
                                        </span>
                                        <span className={`font-medium ${run.status.includes('Error') || run.status.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                            {run.status}
                                        </span>
                                    </div>
                                    <div className="text-gray-500 text-xs truncate max-w-xl" title={run.filters}>
                                        {run.filters}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
