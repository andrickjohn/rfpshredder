// src/contexts/processing-context.tsx
// Purpose: Shared state for real-time processing progress tracking
// Dependencies: React Context API
// Used by: UploadForm (sets progress), ProcessingFlow (displays progress)

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ProcessingContextType {
  currentStep: number; // 0 = not started, 1-7 = active step, 8 = complete
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);

  const reset = () => setCurrentStep(0);

  return (
    <ProcessingContext.Provider value={{ currentStep, setCurrentStep, reset }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}
