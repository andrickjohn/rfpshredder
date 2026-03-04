// src/contexts/processing-context.tsx
// Purpose: Shared state for real-time processing progress tracking
// Dependencies: React Context API
// Used by: UploadForm (sets progress), ProcessingFlow (displays progress)

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ProcessingContextType {
  currentStep: number; // 0 = not started, 1-7 = active step, 8 = complete
  setCurrentStep: (step: number) => void;
  progressPercentage: number;
  setProgressPercentage: (percent: number) => void;
  stepMessages: Record<number, string>;
  setStepMessage: (step: number, message: string) => void;
  elapsedTime: number;
  setElapsedTime: (time: number) => void;
  etaTime: number | null;
  setEtaTime: (time: number | null) => void;
  isStuck: boolean;
  setIsStuck: (stuck: boolean) => void;
  runningCost: number;
  setRunningCost: (cost: number) => void;
  modelName: string;
  setModelName: (name: string) => void;
  reset: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [stepMessages, setStepMessages] = useState<Record<number, string>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [etaTime, setEtaTime] = useState<number | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [runningCost, setRunningCost] = useState(0);
  const [modelName, setModelName] = useState('');

  const setStepMessage = (step: number, message: string) => {
    setStepMessages(prev => ({ ...prev, [step]: message }));
  };

  const reset = () => {
    setCurrentStep(0);
    setProgressPercentage(0);
    setStepMessages({});
    setElapsedTime(0);
    setEtaTime(null);
    setIsStuck(false);
    setRunningCost(0);
    setModelName('');
  };

  return (
    <ProcessingContext.Provider value={{
      currentStep,
      setCurrentStep,
      progressPercentage,
      setProgressPercentage,
      stepMessages,
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
    }}>
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
