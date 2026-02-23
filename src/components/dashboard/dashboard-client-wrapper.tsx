// src/components/dashboard/dashboard-client-wrapper.tsx
// Purpose: Client-side wrapper to provide processing context to dashboard
// Dependencies: ProcessingProvider
// Test spec: qa/test-specs/full-integration.md

'use client';

import { ReactNode } from 'react';
import { ProcessingProvider } from '@/contexts/processing-context';

export function DashboardClientWrapper({ children }: { children: ReactNode }) {
  return <ProcessingProvider>{children}</ProcessingProvider>;
}
