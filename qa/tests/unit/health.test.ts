// qa/tests/unit/health.test.ts
// Purpose: Verify health check and cron endpoints
// Test spec: qa/test-specs/full-integration.md

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('health check endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns healthy when all required env vars set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-123';
    process.env.RESEND_API_KEY = 're_123';

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.supabase).toBe('ok');
    expect(data.checks.stripe).toBe('ok');
    expect(data.checks.anthropic).toBe('ok');
    expect(data.checks.resend).toBe('ok');
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBe('1.0.0');
  });

  it('returns degraded when optional services unconfigured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.RESEND_API_KEY;

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.checks.supabase).toBe('ok');
    expect(data.checks.stripe).toBe('unconfigured');
  });

  it('returns unhealthy when Supabase missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.supabase).toBe('error');
  });
});

describe('trial nudge cron', () => {
  beforeEach(() => {
    vi.mock('resend', () => {
      return { Resend: class { emails = { send: vi.fn() }; } };
    });
    vi.mock('@/lib/email/send', () => ({
      sendEmail: vi.fn(() => Promise.resolve({ success: true })),
    }));
    vi.mock('@/lib/supabase/admin', () => ({
      createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
          })),
        })),
      })),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects requests without valid cron authorization', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { GET } = await import('@/app/api/cron/trial-nudge/route');

    // No auth header
    const noAuth = new Request('https://example.com/api/cron/trial-nudge');
    const response1 = await GET(noAuth);
    expect(response1.status).toBe(401);

    // Wrong auth header
    const wrongAuth = new Request('https://example.com/api/cron/trial-nudge', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const response2 = await GET(wrongAuth);
    expect(response2.status).toBe(401);
  });
});
