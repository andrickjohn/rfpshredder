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
    const [apiLoading, setApiLoading] = useState(false);
    const [uiLoading, setUiLoading] = useState(false);

    const [apiLogs, setApiLogs] = useState<string[]>([]);
    const [uiLogs, setUiLogs] = useState<string[]>([]);

    const [apiResults, setApiResults] = useState<FoundPdf[]>([]);
    const [uiResults, setUiResults] = useState<FoundPdf[]>([]);

    // Direct Lookup (Strategy 3)
    const [directUrl, setDirectUrl] = useState('');
    const [directLoading, setDirectLoading] = useState(false);
    const [directLogs, setDirectLogs] = useState<string[]>([]);
    const [directResults, setDirectResults] = useState<FoundPdf[]>([]);

    // Filters
    const [naics, setNaics] = useState('541511, 541512, 541519, 541611, 541330');
    const [keywords, setKeywords] = useState('section l, section m, schedule l, schedule m, instructions to offerors, evaluation criteria, evaluation factors');
    const [lookbackDays, setLookbackDays] = useState('180');

    // History
    type RunHistoryEntry = {
        id: string;
        timestamp: string;
        mode: string;
        filters: string;
        status: string;
    };
    const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);

    const addApiLog = (msg: string) => setApiLogs((prev) => [...prev, msg]);
    const addUiLog = (msg: string) => setUiLogs((prev) => [...prev, msg]);

    const shuffleNaics = () => {
        const pool = [
            '541511', '541512', '541519', // IT Services
            '541330', // Engineering
            '541611', '541618', // Consulting/Management
            '541690', // Scientific/Tech Consulting
            '541990', // Other Tech Services
            '518210', // Data Processing
            '561210'  // Facilities
        ];
        // Pick 5 random unique
        const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
        setNaics(shuffled.join(', '));
    };

    // Strategy 4: Known-good seed URLs for pipeline validation
    const seedUrls = [
        { label: 'IT Services RFP', url: 'https://sam.gov/search/?index=opp&q=information+technology+services&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BnoticeType%5D%5B0%5D=Combined%20Synopsis%2FSolicitation' },
        { label: 'Cybersecurity', url: 'https://sam.gov/search/?index=opp&q=cybersecurity+assessment&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BnoticeType%5D%5B0%5D=Solicitation' },
        { label: 'Software Dev', url: 'https://sam.gov/search/?index=opp&q=software+development+services&sort=-modifiedDate&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BnoticeType%5D%5B0%5D=Solicitation' },
    ];

    const startDirectLookup = async () => {
        if (!directUrl.trim()) return;
        setDirectLoading(true);
        setDirectLogs([]);
        setDirectResults([]);

        const addLog = (msg: string) => setDirectLogs(prev => [...prev, msg]);
        addLog(`🎯 Direct Lookup: ${directUrl}`);

        let runStatus = 'Finished';
        let foundCount = 0;

        try {
            const res = await fetch('/api/admin/scrape-sam-direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: directUrl,
                    keywords: keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
                })
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('No response body');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                for (const line of chunk.split('\n')) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'log') addLog(data.message);
                        else if (data.type === 'result') {
                            setDirectResults(prev => [...prev, data.match]);
                            addLog(`🎉 MATCH: ${data.match.filename}`);
                            foundCount++;
                        }
                        else if (data.type === 'done') foundCount = data.count || foundCount;
                    } catch { }
                }
            }
        } catch (err: unknown) {
            runStatus = 'Failed';
            addLog(`❌ ${(err as Error).message}`);
        } finally {
            setDirectLoading(false);
            setRunHistory(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString(),
                mode: 'DIRECT',
                filters: `URL: ${directUrl.substring(0, 60)}`,
                status: `${runStatus} (${foundCount} found)`
            }, ...prev]);
        }
    };

    const startScrape = async (mode: 'api' | 'ui') => {
        const setLoading = mode === 'api' ? setApiLoading : setUiLoading;
        const setLogs = mode === 'api' ? setApiLogs : setUiLogs;
        const setResults = mode === 'api' ? setApiResults : setUiResults;
        const addLog = mode === 'api' ? addApiLog : addUiLog;

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative">
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">NAICS Codes (comma prep)</label>
                        <button
                            type="button"
                            onClick={shuffleNaics}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-0.5 rounded transition-colors"
                        >
                            Shuffle 🎲
                        </button>
                    </div>
                    <input
                        type="text"
                        value={naics}
                        onChange={e => setNaics(e.target.value)}
                        disabled={apiLoading || uiLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Keywords</label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        disabled={apiLoading || uiLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lookback Days</label>
                    <input
                        type="number"
                        value={lookbackDays}
                        onChange={e => setLookbackDays(e.target.value)}
                        disabled={apiLoading || uiLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* --- API SCRAPER PANEL --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <button
                            onClick={() => startScrape('api')}
                            disabled={apiLoading}
                            className="w-full sm:w-auto px-4 py-2 bg-[#1B365D] text-white rounded-md font-medium disabled:opacity-50 hover:bg-[#152a48] transition-colors"
                        >
                            {apiLoading ? 'Scraping...' : 'Start API Profile'}
                        </button>
                        <div className="text-sm text-gray-500">
                            <strong>SAM.gov API v2</strong> — Scored attachments · Structured L+M detection · Smart retry
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-green-400 h-80 overflow-y-auto break-all">
                            {apiLogs.length === 0 ? (
                                <span className="text-gray-500">API Logs waiting...</span>
                            ) : (
                                apiLogs.map((log, i) => <div key={i}>{log}</div>)
                            )}
                        </div>
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 h-80 overflow-y-auto">
                            <h3 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-gray-50 pb-2 border-b border-gray-200">API Results</h3>
                            <div className="space-y-3">
                                {apiResults.map((res, i) => (
                                    <div key={i} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                        <div className="text-sm font-semibold text-gray-900 line-clamp-2" title={res.oppTitle}>{res.oppTitle}</div>
                                        <div className="text-xs text-gray-500 mt-1">Sol: {res.solicitation}</div>
                                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-xs font-medium text-brand-green hover:underline">Download PDF →</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- UI SCRAPER PANEL --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                        <button
                            onClick={() => startScrape('ui')}
                            disabled={uiLoading}
                            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors"
                        >
                            {uiLoading ? 'Scraping...' : 'Start UI Bypass'}
                        </button>
                        <div className="text-sm text-gray-500">
                            <strong>Browser Engine v2</strong> — Bypasses API limits · Scored downloads · L+M proximity
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-[#c084fc] h-80 overflow-y-auto break-all">
                            {uiLogs.length === 0 ? (
                                <span className="text-gray-500">UI Logs waiting...</span>
                            ) : (
                                uiLogs.map((log, i) => <div key={i}>{log}</div>)
                            )}
                        </div>
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 h-80 overflow-y-auto">
                            <h3 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-gray-50 pb-2 border-b border-gray-200">UI Results</h3>
                            <div className="space-y-3">
                                {uiResults.map((res, i) => (
                                    <div key={i} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                        <div className="text-sm font-semibold text-gray-900 line-clamp-2" title={res.oppTitle}>{res.oppTitle}</div>
                                        <div className="text-xs text-gray-500 mt-1">Sol: {res.solicitation}</div>
                                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-xs font-medium text-brand-green hover:underline">Download PDF →</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DIRECT LOOKUP (Strategy 3 + 4) --- */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">🎯 Direct Lookup v2</h3>
                    <span className="text-xs text-gray-400">Scored attachments · Structured L+M · Paste URL or solicitation #</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={directUrl}
                        onChange={e => setDirectUrl(e.target.value)}
                        placeholder="https://sam.gov/opp/... or solicitation number"
                        disabled={directLoading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                        onClick={startDirectLookup}
                        disabled={directLoading || !directUrl.trim()}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md font-medium disabled:opacity-50 hover:bg-amber-700 transition-colors text-sm"
                    >
                        {directLoading ? 'Looking up...' : 'Lookup'}
                    </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 mt-0.5">Seeds:</span>
                    {seedUrls.map((seed, i) => (
                        <button
                            key={i}
                            onClick={() => { setDirectUrl(seed.url); }}
                            className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                            {seed.label}
                        </button>
                    ))}
                </div>
                {directLogs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-900 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-amber-400 h-64 overflow-y-auto break-all">
                            {directLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 h-64 overflow-y-auto">
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Direct Results</h4>
                            {directResults.length === 0 ? (
                                <p className="text-xs text-gray-400">No matches yet...</p>
                            ) : (
                                <div className="space-y-2">
                                    {directResults.map((res, i) => (
                                        <div key={i} className="bg-white p-2 rounded shadow-sm border border-gray-200">
                                            <div className="text-xs font-semibold text-gray-900">{res.filename}</div>
                                            <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline">Download →</a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
