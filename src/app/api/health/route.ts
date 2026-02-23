// src/app/api/health/route.ts
// Purpose: Health check endpoint for uptime monitoring
// Dependencies: supabase/admin
// SECURITY: Public endpoint — returns status only, no sensitive data

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: Record<string, 'ok' | 'error' | 'unconfigured'>;
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const checks = {
    supabase: checkEnv('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    stripe: checkEnv('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'),
    anthropic: checkEnv('ANTHROPIC_API_KEY'),
    resend: checkEnv('RESEND_API_KEY'),
  };

  const allOk = Object.values(checks).every((v) => v === 'ok');
  const anyError = checks.supabase === 'error';

  const status: HealthStatus = {
    status: anyError ? 'unhealthy' : allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks,
  };

  return NextResponse.json(status, {
    status: anyError ? 503 : 200,
  });
}

function checkEnv(...keys: string[]): 'ok' | 'error' | 'unconfigured' {
  const allSet = keys.every((k) => process.env[k] && process.env[k] !== '');
  if (!allSet) {
    // Supabase is required; others are optional until configured
    if (keys.some((k) => k.includes('SUPABASE'))) return 'error';
    return 'unconfigured';
  }
  return 'ok';
}
