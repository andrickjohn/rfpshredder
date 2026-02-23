// src/components/dashboard/upload-form.tsx
// Purpose: RFP upload form with drag-and-drop, progress, error handling
// Dependencies: react, processing-context
// Test spec: qa/test-specs/full-integration.md

'use client';

import { useState, useRef } from 'react';
import { useProcessing } from '@/contexts/processing-context';

interface UploadFormProps {
  canShred: boolean;
  isTrialExhausted: boolean;
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

export function UploadForm({ canShred, isTrialExhausted }: UploadFormProps) {
  const { setCurrentStep, reset } = useProcessing();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload (immediate)
      setCurrentStep(1);
      setProgress('Uploading your RFP...');

      const response = await fetch('/api/shred', {
        method: 'POST',
        body: formData,
      });

      // Simulate progress steps during processing
      // In a real streaming implementation, the backend would send progress events
      const progressSteps = [
        { step: 2, message: 'Parsing document structure...', delay: 2000 },
        { step: 3, message: 'Extracting Section L & M requirements...', delay: 5000 },
        { step: 4, message: 'Classifying obligation levels...', delay: 2000 },
        { step: 5, message: 'Generating cross-references...', delay: 2000 },
        { step: 6, message: 'Building Excel compliance matrix...', delay: 2000 },
      ];

      // Start progress simulation
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const { step, message } = progressSteps[stepIndex];
          setCurrentStep(step);
          setProgress(message);
          stepIndex++;
        }
      }, 3000); // Update every 3 seconds

      if (!response.ok) {
        clearInterval(progressInterval);
        reset();
        const data = await response.json();
        setError(data.error?.message || 'An error occurred while processing your RFP.');
        setStatus('error');
        return;
      }

      const blob = await response.blob();
      clearInterval(progressInterval);

      // Step 7: Download
      setCurrentStep(7);
      setProgress('Downloading compliance matrix...');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compliance-matrix.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Complete - all steps done
      setCurrentStep(8);
      setStatus('success');
      setProgress('');
      setFile(null);

      // Reset after 3 seconds
      setTimeout(() => reset(), 3000);
    } catch {
      reset();
      setError('Unable to connect to the server. Please check your connection and try again.');
      setStatus('error');
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
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          file ? 'border-brand-green bg-green-50' : 'border-gray-300 hover:border-gray-400'
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

      {error && (
        <div role="alert" className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {status === 'processing' && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-3">
          <svg className="animate-spin w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {progress}
        </div>
      )}

      {status === 'success' && (
        <div role="status" className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
          Your compliance matrix has been downloaded. Upload another RFP to shred again.
        </div>
      )}

      {file && status !== 'processing' && (
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
