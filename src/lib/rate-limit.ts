// src/lib/rate-limit.ts
// Purpose: In-memory rate limiter (Map-based, no Redis needed for free tier)
// Dependencies: none
// Test spec: qa/test-specs/auth.md

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow Node process to exit even if timer is running
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  /** Unique identifier for this rate limit (e.g., "login", "signup") */
  name: string;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume a rate limit token.
 * @param key - Unique key for the rate limit (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining tokens
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const storeKey = `${config.name}:${key}`;
  const now = Date.now();
  const entry = rateLimitStore.get(storeKey);

  // No entry or expired window — allow and start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(storeKey, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Within window — check limit
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Within window and under limit — increment
  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Pre-defined rate limit configs per security-rules.md
export const RATE_LIMITS = {
  login: {
    name: 'login',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  signup: {
    name: 'signup',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  shred: {
    name: 'shred',
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  billing: {
    name: 'billing',
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

// Reset for testing
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}
