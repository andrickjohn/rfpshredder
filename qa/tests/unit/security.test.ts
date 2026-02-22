// qa/tests/unit/security.test.ts
// Purpose: Verify security headers and CSP configuration
// Test spec: qa/test-specs/full-integration.md
// Reference: docs/architecture/security-model.md

import { describe, it, expect } from 'vitest';
import { SECURITY_HEADERS } from '@/lib/security/headers';

describe('SECURITY_HEADERS', () => {
  it('includes HSTS with 1-year max-age, includeSubDomains, preload', () => {
    const hsts = SECURITY_HEADERS['Strict-Transport-Security'];
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('includes X-Content-Type-Options: nosniff', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
  });

  it('includes X-Frame-Options: DENY', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('includes X-XSS-Protection', () => {
    expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
  });

  it('includes Referrer-Policy: strict-origin-when-cross-origin', () => {
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('includes Permissions-Policy disabling camera, microphone, geolocation', () => {
    const pp = SECURITY_HEADERS['Permissions-Policy'];
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
  });

  it('includes Content-Security-Policy', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toBeDefined();
  });

  it('has all 7 required security headers', () => {
    const requiredHeaders = [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy',
    ];
    for (const header of requiredHeaders) {
      expect(SECURITY_HEADERS).toHaveProperty(header);
    }
  });
});

describe('Content-Security-Policy directives', () => {
  const csp = SECURITY_HEADERS['Content-Security-Policy'];

  it('restricts default-src to self', () => {
    expect(csp).toContain("default-src 'self'");
  });

  it('allows Stripe JS in script-src', () => {
    expect(csp).toContain('https://js.stripe.com');
  });

  it('allows Supabase connections in connect-src', () => {
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('wss://*.supabase.co');
  });

  it('allows Stripe API in connect-src', () => {
    expect(csp).toContain('https://api.stripe.com');
  });

  it('allows Stripe frames in frame-src', () => {
    expect(csp).toContain('https://js.stripe.com');
    expect(csp).toContain('https://hooks.stripe.com');
  });

  it('blocks object embeds', () => {
    expect(csp).toContain("object-src 'none'");
  });

  it('restricts base-uri to self', () => {
    expect(csp).toContain("base-uri 'self'");
  });

  it('restricts form-action to self', () => {
    expect(csp).toContain("form-action 'self'");
  });
});
