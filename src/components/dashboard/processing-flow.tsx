// src/components/dashboard/processing-flow.tsx
// Purpose: 7-step visual pipeline diagram explaining the shredding process
// Dependencies: none (uses localStorage for dismiss state)

'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'rfps-flow-dismissed';

const steps = [
  {
    title: 'Upload',
    description: 'Drop your PDF or DOCX (up to 300 pages, 50MB)',
  },
  {
    title: 'Parse',
    description: 'AI reads and structures every page',
  },
  {
    title: 'Extract',
    description: 'Every Section L & M requirement identified',
  },
  {
    title: 'Classify',
    description: 'Shall, Must, Should, May, Will obligation levels',
  },
  {
    title: 'Cross-Ref',
    description: 'L instructions mapped to M evaluation factors',
  },
  {
    title: 'Generate',
    description: 'Excel with color-coding, filters, dropdowns',
  },
  {
    title: 'Download',
    description: 'Auto-downloads to your computer, then purged',
  },
];

export function ProcessingFlow() {
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (dismissed) {
    return (
      <button
        onClick={() => { setDismissed(false); localStorage.removeItem(STORAGE_KEY); }}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Show how it works
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">How RFP Shredder Works</h3>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem(STORAGE_KEY, 'true'); }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Desktop: horizontal flow */}
      <div className="hidden md:grid md:grid-cols-7 gap-1">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center text-center relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="absolute top-4 left-[calc(50%+16px)] right-0 h-px bg-gray-200 z-0" />
            )}
            {/* Step number */}
            <div className="w-8 h-8 rounded-full bg-[#1B365D] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10">
              {i + 1}
            </div>
            <p className="text-xs font-semibold text-gray-900 mt-2 leading-tight">{step.title}</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Mobile: vertical flow */}
      <div className="md:hidden space-y-4">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1B365D] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {i + 1}
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: timing + security */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Average processing time: ~2 minutes
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Zero retention — document purged after download
        </p>
      </div>
    </div>
  );
}
