// src/components/dashboard/processing-flow.tsx
// Purpose: Interactive 7-step pipeline with real-time progress tracking
// Dependencies: useProcessing hook for live progress updates
// Test spec: qa/test-specs/full-integration.md

'use client';

import { useState, useEffect } from 'react';
import { useProcessing } from '@/contexts/processing-context';

const STORAGE_KEY = 'rfps-flow-dismissed';

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: number;
  title: string;
  brief: string;
  detail: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Upload',
    brief: 'PDF/DOCX to server',
    detail: 'Your RFP document (PDF or DOCX, up to 300 pages, 50MB max) is securely uploaded to our ephemeral processing environment. The file is validated for type, size, and integrity before proceeding.',
  },
  {
    id: 2,
    title: 'Parse',
    brief: 'Extract text & structure',
    detail: 'Our parser reads every page of your document, extracting text content while preserving document structure. For PDFs, we use advanced text extraction. For DOCX files, we parse the underlying XML structure.',
  },
  {
    id: 3,
    title: 'Extract',
    brief: 'Find L & M requirements',
    detail: 'Claude AI scans the entire document to identify Section L (Instructions) and Section M (Evaluation Factors). Every requirement is extracted with its full text, page number, and section reference.',
  },
  {
    id: 4,
    title: 'Classify',
    brief: 'Identify obligation levels',
    detail: 'Each requirement is analyzed for obligation language: "shall" (mandatory), "must" (mandatory), "should" (recommended), "may" (optional), "will" (future), plus variants like "is required to" and "is expected to".',
  },
  {
    id: 5,
    title: 'Cross-Ref',
    brief: 'Map L to M factors',
    detail: 'Our cross-reference engine intelligently maps Section L instructions to their corresponding Section M evaluation factors using three strategies: explicit references (e.g., "per M.2.1"), section alignment, and keyword similarity.',
  },
  {
    id: 6,
    title: 'Generate',
    brief: 'Build Excel matrix',
    detail: 'An Excel compliance matrix is generated with 8 columns: Requirement ID, RFP Section, Page, Requirement Text, Obligation Level, Evaluation Factor Mapping, Response Strategy, and Compliance Status. Color-coded, filterable, with dropdowns and metadata.',
  },
  {
    id: 7,
    title: 'Download',
    brief: 'Auto-download & purge',
    detail: 'The Excel file automatically downloads to your computer. Immediately after download, ALL document content (uploaded file, extracted text, generated matrix) is permanently purged from memory. Nothing is stored on our servers.',
  },
];

export function ProcessingFlow() {
  const { currentStep } = useProcessing();
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
    setLoaded(true);
  }, []);

  const getStepStatus = (stepId: number): StepStatus => {
    if (currentStep === 0) return 'pending'; // Not started
    if (currentStep === 8) return 'complete'; // All complete
    if (stepId < currentStep) return 'complete';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (status: StepStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-400 border-gray-200';
      case 'active':
        return 'bg-blue-500 text-white border-blue-500 animate-pulse';
      case 'complete':
        return 'bg-green-500 text-white border-green-500';
    }
  };

  const getConnectorColor = (fromStep: number): string => {
    const status = getStepStatus(fromStep);
    if (status === 'complete') return 'bg-green-500';
    if (status === 'active' && getStepStatus(fromStep + 1) === 'active') return 'bg-blue-500';
    return 'bg-gray-200';
  };

  if (!loaded) return null;

  if (dismissed) {
    return (
      <div className="text-center py-3">
        <button
          onClick={() => {
            setDismissed(false);
            localStorage.removeItem(STORAGE_KEY);
          }}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          ↓ Show processing pipeline ↓
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border-2 border-gray-200 p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Processing Pipeline
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {currentStep === 0 && 'Upload an RFP above to see live progress'}
            {currentStep > 0 && currentStep < 8 && `Processing: Step ${currentStep} of 7`}
            {currentStep === 8 && 'Processing complete! ✓'}
          </p>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem(STORAGE_KEY, 'true');
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded hover:bg-white/50"
          aria-label="Dismiss pipeline"
        >
          Hide
        </button>
      </div>

      {/* Desktop: horizontal flow */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between gap-2 relative">
          {steps.map((step, i) => {
            const status = getStepStatus(step.id);
            const isExpanded = expandedStep === step.id;

            return (
              <div key={step.id} className="flex-1 relative">
                {/* Connector line between steps */}
                {i < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-[calc(50%+24px)] right-[-50%] h-1 transition-all duration-500 ${getConnectorColor(
                      step.id
                    )}`}
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* Step bubble - clickable */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className="flex flex-col items-center text-center w-full group relative z-10"
                  aria-label={`${step.title}: ${step.brief}`}
                  aria-expanded={isExpanded}
                >
                  {/* Number circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${getStepColor(
                      status
                    )} ${status === 'pending' ? 'group-hover:border-gray-400 group-hover:bg-gray-300' : ''}`}
                  >
                    {status === 'complete' ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>

                  {/* Step label */}
                  <p className="text-xs font-bold text-gray-900 mt-2">{step.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{step.brief}</p>

                  {/* Click indicator */}
                  {!isExpanded && (
                    <p className="text-[10px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      click for details
                    </p>
                  )}
                </button>

                {/* Expanded detail card */}
                {isExpanded && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-gray-900">{step.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedStep(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        aria-label="Close"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{step.detail}</p>
                    {/* Arrow pointing up to the step */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical flow */}
      <div className="md:hidden space-y-3">
        {steps.map((step, i) => {
          const status = getStepStatus(step.id);
          const isExpanded = expandedStep === step.id;

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`absolute top-10 left-5 w-1 h-8 transition-all duration-500 ${getConnectorColor(step.id)}`}
                />
              )}

              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className="flex items-start gap-3 w-full text-left group"
                aria-label={`${step.title}: ${step.brief}`}
                aria-expanded={isExpanded}
              >
                {/* Number circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all duration-300 ${getStepColor(
                    status
                  )}`}
                >
                  {status === 'complete' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.brief}</p>
                  {!isExpanded && <p className="text-xs text-blue-500 mt-1">Tap for details</p>}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="ml-13 mt-2 bg-white rounded-lg border border-gray-200 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-gray-600 leading-relaxed">{step.detail}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-700">
            Avg time: <span className="text-blue-600 font-bold">~2 min</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-700">
            <span className="text-green-600 font-bold">Zero retention</span> — purged after download
          </p>
        </div>
      </div>
    </div>
  );
}
