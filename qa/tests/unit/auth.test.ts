// qa/tests/unit/auth.test.ts
// Purpose: Unit tests for auth validations and rate limiter
// Test spec: qa/test-specs/auth.md

import { describe, it, expect, beforeEach } from 'vitest';
import { validateEmail, validatePassword, signupSchema, loginSchema } from '@/lib/validations/auth';
import { checkRateLimit, RATE_LIMITS, _resetRateLimitStore } from '@/lib/rate-limit';

// ============================================================
// EMAIL VALIDATION
// ============================================================
describe('validateEmail', () => {
  it('accepts valid email addresses', () => {
    expect(validateEmail('valid@email.com')).toBe(true);
    expect(validateEmail('user@company.org')).toBe(true);
    expect(validateEmail('test.user@domain.co')).toBe(true);
  });

  it('accepts email with + alias', () => {
    expect(validateEmail('user+test@email.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('no-at-sign')).toBe(false);
    expect(validateEmail('@no-local-part.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('handles case-insensitive emails via schema normalization', () => {
    // The emailSchema lowercases input
    const result = loginSchema.safeParse({ email: 'USER@EMAIL.COM', password: 'password123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@email.com');
    }
  });
});

// ============================================================
// PASSWORD VALIDATION
// ============================================================
describe('validatePassword', () => {
  it('rejects short passwords (min 8 chars)', () => {
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  it('accepts valid passwords', () => {
    expect(validatePassword('ValidPass123!')).toBe(true);
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('a long passphrase here')).toBe(true);
  });
});

// ============================================================
// SIGNUP SCHEMA
// ============================================================
describe('signupSchema', () => {
  it('validates a complete valid signup', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Jane Smith',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing full name', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      fullName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name with invalid characters (XSS prevention)', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      fullName: '<script>alert("xss")</script>',
    });
    expect(result.success).toBe(false);
  });

  it('rejects SQL injection patterns that are invalid emails', () => {
    // Blatant SQL injection with spaces and keywords (not valid email)
    const result1 = signupSchema.safeParse({
      email: "' OR 1=1; DROP TABLE users;--",
      password: 'password123',
      fullName: 'Test User',
    });
    expect(result1.success).toBe(false);

    // Note: admin'--@evil.com is technically RFC-valid email.
    // SQL injection is ultimately prevented by parameterized queries (Supabase),
    // not by email validation. This test verifies the first layer of defense.
    const result2 = signupSchema.safeParse({
      email: "admin'; DROP TABLE profiles;--",
      password: 'password123',
      fullName: 'Test User',
    });
    expect(result2.success).toBe(false);
  });
});

// ============================================================
// LOGIN SCHEMA
// ============================================================
describe('loginSchema', () => {
  it('validates a valid login', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('trims and lowercases email', () => {
    const result = loginSchema.safeParse({
      email: '  TEST@Example.COM  ',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });
});

// ============================================================
// RATE LIMITER
// ============================================================
describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it('allows requests within the limit', () => {
    const config = { name: 'test', maxRequests: 3, windowMs: 60000 };
    const result1 = checkRateLimit('192.168.1.1', config);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit('192.168.1.1', config);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
  });

  it('blocks requests exceeding the limit', () => {
    const config = { name: 'test', maxRequests: 2, windowMs: 60000 };
    checkRateLimit('192.168.1.1', config);
    checkRateLimit('192.168.1.1', config);

    const result = checkRateLimit('192.168.1.1', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks different IPs independently', () => {
    const config = { name: 'test', maxRequests: 1, windowMs: 60000 };
    checkRateLimit('192.168.1.1', config);

    const result = checkRateLimit('192.168.1.2', config);
    expect(result.allowed).toBe(true);
  });

  it('tracks different rate limit names independently', () => {
    const loginConfig = { name: 'login', maxRequests: 1, windowMs: 60000 };
    const signupConfig = { name: 'signup', maxRequests: 1, windowMs: 60000 };

    checkRateLimit('192.168.1.1', loginConfig);

    const result = checkRateLimit('192.168.1.1', signupConfig);
    expect(result.allowed).toBe(true);
  });

  it('enforces login rate limit (5 per 15 min)', () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(ip, RATE_LIMITS.login);
      expect(result.allowed).toBe(true);
    }
    // 6th attempt should be blocked
    const blocked = checkRateLimit(ip, RATE_LIMITS.login);
    expect(blocked.allowed).toBe(false);
  });

  it('enforces signup rate limit (3 per hour)', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(ip, RATE_LIMITS.signup);
      expect(result.allowed).toBe(true);
    }
    // 4th attempt should be blocked
    const blocked = checkRateLimit(ip, RATE_LIMITS.signup);
    expect(blocked.allowed).toBe(false);
  });

  it('returns resetAt timestamp', () => {
    const config = { name: 'test', maxRequests: 5, windowMs: 60000 };
    const before = Date.now();
    const result = checkRateLimit('192.168.1.1', config);
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60000);
  });
});
