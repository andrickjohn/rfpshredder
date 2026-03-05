// src/components/dashboard/upload-form.tsx
// Purpose: RFP upload form with drag-and-drop, progress, error handling
// Dependencies: react, processing-context
// Test spec: qa/test-specs/full-integration.md

'use client';

import { useState, useRef, useEffect } from 'react';
import { useProcessing } from '@/contexts/processing-context';

interface UploadFormProps {
  canShred: boolean;
  isTrialExhausted: boolean;
  isSuperAdmin?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export function validateUploadFile(file: { name: string; size: number }): string | null {
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type: ${ext}. Please upload a PDF or DOCX file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 50MB.`;
  }
  if (file.size === 0) {
    return 'The file appears to be empty. Please upload a valid PDF or DOCX.';
  }
  return null;
}

export function UploadForm({ canShred, isTrialExhausted, isSuperAdmin = false }: UploadFormProps) {
  const {
    setCurrentStep,
    setProgressPercentage,
    progressPercentage,
    setStepMessage,
    elapsedTime,
    setElapsedTime,
    etaTime,
    setEtaTime,
    isStuck,
    setIsStuck,
    runningCost,
    setRunningCost,
    modelName,
    setModelName,
    reset
  } = useProcessing();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [cancelController, setCancelController] = useState<AbortController | null>(null);
  const [excelUrl, setExcelUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());

  // Watchdog & Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'processing') {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedSecs = Math.floor((now - startTimeRef.current) / 1000);

        // 1. Stuck Detection (15s timeout)
        if (now - lastActivityTimeRef.current > 15000) {
          setIsStuck(true);
        } else {
          setIsStuck(false);
        }

        // 2. Elapsed Time Update
        setElapsedTime(elapsedSecs);

        // 3. ETA Extrapolation
        if (progressPercentage > 0 && progressPercentage < 100) {
          const projectedTotal = elapsedSecs / (progressPercentage / 100);
          const remaining = Math.max(0, Math.round(projectedTotal - elapsedSecs));
          setEtaTime(remaining);
        } else {
          setEtaTime(null);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status, progressPercentage, setElapsedTime, setEtaTime, setIsStuck]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  function handleFileSelect(selectedFile: File) {
    setError(null);
    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
  }

  async function handleShred() {
    if (!file) return;

    setStatus('processing');
    setError(null);
    reset(); // Reset progress to step 0

    const controller = new AbortController();
    setCancelController(controller);

    // Initialize timers
    startTimeRef.current = Date.now();
    lastActivityTimeRef.current = Date.now();
    setIsStuck(false);
    setElapsedTime(0);
    setEtaTime(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload (immediate)
      setCurrentStep(1);
      setProgressPercentage(0);
      setProgress('Uploading your RFP...');
      setStepMessage(1, 'Uploading your configuration');

      const response = await fetch('/api/shred', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        setCancelController(null);
        reset();
        try {
          const data = await response.json();
          console.error('API error details:', data);
          setError(data.error?.message || `Error ${response.status}: ${response.statusText}`);
        } catch {
          setError(`Server error: ${response.status} ${response.statusText}`);
        }
        setStatus('error');
        return;
      }

      // Stream parsing
      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let buffer = '';
      let isComplete = false;

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          // NDJSON lines
          const lines = buffer.split('\n');
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            let event: { type?: string; error?: { message?: string }; step?: number; message?: string; current?: number; total?: number; percentage?: number; runningCost?: number; modelName?: string; excelBase64?: string };
            try {
              event = JSON.parse(line);
            } catch (e) {
              console.warn('Failed to parse NDJSON line:', line, e);
              continue; // Skip this malformed line but keep reading stream
            }

            // Watchdog reset on ANY network activity (ping, progress, etc)
            lastActivityTimeRef.current = Date.now();

            if (event.type === 'error') {
              throw new Error(event.error?.message || 'Server processing error');
            } else if (event.type === 'progress') {
              if (event.step) setCurrentStep(event.step);
              if (event.message) {
                setProgress(event.message);
                if (event.step) setStepMessage(event.step, event.message);
              }
              if (typeof event.current === 'number' && typeof event.total === 'number' && event.total > 0) {
                setProgressPercentage(Math.round((event.current / event.total) * 100));
              } else if (typeof event.percentage === 'number') {
                setProgressPercentage(event.percentage);
              }
              if (event.runningCost !== undefined) setRunningCost(event.runningCost);
              if (event.modelName !== undefined) setModelName(event.modelName);
            } else if (event.type === 'complete') {
              isComplete = true;
              // Step 7: Download
              setCurrentStep(7);
              setProgressPercentage(100);
              setProgress('Downloading compliance matrix...');
              setStepMessage(7, 'Compliance matrix ready');

              // Decode base64 to blob
              const byteCharacters = atob(event.excelBase64 || '');
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

              const url = URL.createObjectURL(blob);
              setExcelUrl(url);

              // Auto-download helper
              const a = document.createElement('a');
              a.href = url;
              a.download = 'compliance-matrix.xlsx';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

              // Complete - all steps done
              setCurrentStep(8);
              setStatus('success');
              setProgress('');
              setCancelController(null);
              // Intentionally removed URL.revokeObjectURL and the 3s reset so user can hit Download manually if blocked
            }
          } // closes for (const line of lines)

          if (done) {
            // Process any trailing data in the buffer
            if (buffer.trim()) {
              try {
                const event = JSON.parse(buffer);
                if (event.type === 'progress') {
                  if (event.runningCost !== undefined) setRunningCost(event.runningCost);
                  if (event.modelName !== undefined) setModelName(event.modelName);
                } else if (event.type === 'complete') {
                  isComplete = true;
                  setCurrentStep(7);
                  setProgressPercentage(100);
                  setProgress('Downloading compliance matrix...');
                  setStepMessage(7, 'Compliance matrix ready');

                  const byteCharacters = atob(event.excelBase64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                  const url = URL.createObjectURL(blob);
                  setExcelUrl(url);

                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'compliance-matrix.xlsx';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);

                  setCurrentStep(8);
                  setStatus('success');
                  setProgress('');
                  setCancelController(null);
                }
              } catch (e) {
                console.warn('Failed to parse trailing buffer:', e);
              }
            }

            if (!isComplete && !cancelController?.signal.aborted) {
              throw new Error('Connection closed by server prematurely.');
            }
            break;
          }
        } // closes if (value)

        // Ensure done is evaluated even if value is falsy
        if (done && !value) {
          if (!isComplete && !cancelController?.signal.aborted) {
            throw new Error('Connection closed by server prematurely without complete event.');
          }
          break;
        }
      } // closes while (true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Upload canceled by user');
        reset();
        setError('Processing canceled.');
        setStatus('error'); // Show error temporarily
        setTimeout(() => setError(null), 3000);
      } else {
        reset();
        console.error('Upload error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Unable to connect to the server: ${errorMessage}. Please check your connection and try again.`);
        setStatus('error');
      }
      setCancelController(null);
    }
  }

  function handleCancel() {
    if (cancelController) {
      cancelController.abort();
      setCancelController(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }

  if (!canShred) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isTrialExhausted ? 'Free trial used' : 'Subscription required'}
        </h3>
        <p className="text-gray-500 mb-6">
          {isTrialExhausted
            ? 'You\'ve used your free shred. Subscribe to continue processing RFPs.'
            : 'Subscribe to the Solo plan to start shredding RFPs.'}
        </p>
        <button
          onClick={async () => {
            const res = await fetch('/api/billing/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Subscribe — $99/month
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      {status !== 'success' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${file ? 'border-brand-green bg-green-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          role="button"
          aria-label="Upload RFP file"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="hidden"
            aria-label="Select file"
          />
          {file ? (
            <>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB — Ready to shred
              </p>
            </>
          ) : (
            <>
              <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-900">
                Drop your RFP here, or click to browse
              </p>
              <p className="mt-1 text-sm text-gray-500">PDF or DOCX, up to 50MB</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {status === 'processing' && (
        <div className="mt-4 relative overflow-hidden flex flex-row items-center justify-between p-4 text-blue-700 rounded-lg text-sm border border-blue-100 bg-blue-50">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-100/60 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />

          <div className="flex items-center gap-3 relative z-10 font-medium w-full pr-4">
            <svg className="animate-spin w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="truncate">{progress}</span>
              <span className="text-blue-600/80 text-xs font-normal mt-0.5 tracking-tight flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Elapsed: {formatTime(elapsedTime)}
                {etaTime !== null && ` | ETA: ~${formatTime(etaTime)}`}
                {isSuperAdmin && modelName && ` | Model: ${modelName}`}
                {isSuperAdmin && runningCost > 0 && ` | Cost: $${runningCost.toFixed(3)}`}
              </span>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded relative z-10"
          >
            Cancel
          </button>
        </div>
      )}

      {isStuck && status === 'processing' && (
        <div role="alert" className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 shadow-sm animate-in zoom-in duration-300">
          <div className="flex items-center font-bold mb-1.5">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Process appears stuck
          </div>
          The server hasn&apos;t responded in over 15 seconds. If this is a very large document, it may occasionally pause during intensive extraction. You can continue waiting, or hit Cancel above to try again.
        </div>
      )}

      {status === 'success' && (
        <div className="mt-2 p-8 bg-green-50 rounded-xl text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">Processing Complete!</h3>
          <p className="text-green-800 mb-8 max-w-md mx-auto">
            Your document has been successfully shredded and purged from our servers.
            Click the button below to download the generated Excel matrix.
          </p>

          {isSuperAdmin && runningCost > 0 && (
            <div className="mb-6 text-sm font-medium text-green-800 bg-green-100/50 py-3 px-6 rounded-xl inline-block text-left border border-green-200">
              <div className="flex flex-col gap-1">
                <span><strong>Model Used:</strong> {modelName}</span>
                <span><strong>Total Cost:</strong> ${runningCost.toFixed(3)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {excelUrl && (
              <a
                href={excelUrl}
                download="compliance-matrix.xlsx"
                className="inline-flex items-center justify-center bg-brand-green hover:bg-brand-green-dark text-white font-medium px-8 py-3 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Excel Matrix
              </a>
            )}

            <button
              onClick={() => {
                reset();
                setStatus('idle');
                setFile(null);
                setExcelUrl(null);
              }}
              className="inline-flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-lg transition-colors"
            >
              Upload Another RFP
            </button>
          </div>
        </div>
      )}

      {file && status !== 'processing' && status !== 'success' && (
        <button
          onClick={handleShred}
          className="mt-6 w-full bg-navy hover:bg-navy-dark text-white font-medium py-3 rounded-lg transition-colors"
        >
          Shred This RFP
        </button>
      )}
    </div>
  );
}
