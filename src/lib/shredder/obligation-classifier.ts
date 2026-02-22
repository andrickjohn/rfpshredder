// src/lib/shredder/obligation-classifier.ts
// Purpose: Classify obligation levels in requirement text (local, no API needed)
// Dependencies: ./types
// Test spec: qa/test-specs/core-product.md

import type { ObligationLevel } from './types';

/**
 * Obligation patterns ordered by precedence (strongest first).
 * Each pattern matches the obligation keyword in context to avoid false positives.
 */
const OBLIGATION_PATTERNS: Array<{ level: ObligationLevel; pattern: RegExp }> = [
  // "is required to" — strongest mandatory
  { level: 'is required to', pattern: /\bis\s+required\s+to\b/i },
  // "shall" — standard federal mandatory
  { level: 'shall', pattern: /\bshall\b/i },
  // "must" — strong mandatory
  { level: 'must', pattern: /\bmust\b/i },
  // "is expected to" — strong recommendation
  { level: 'is expected to', pattern: /\bis\s+expected\s+to\b/i },
  // "will" — future obligation (often mandatory in federal context)
  { level: 'will', pattern: /\bwill\b/i },
  // "should" — recommendation
  { level: 'should', pattern: /\bshould\b/i },
  // "may" — optional/permissive
  { level: 'may', pattern: /\bmay\b/i },
];

/**
 * Classify the obligation level of a requirement statement.
 *
 * Scans the text for obligation keywords in precedence order.
 * In federal contracting:
 * - "shall" and "must" are mandatory (non-negotiable)
 * - "should" is a strong recommendation
 * - "may" is optional/permissive
 * - "will" is typically a statement of future action (often mandatory)
 * - "is required to" / "is expected to" are explicit obligation phrases
 *
 * @param text - The requirement statement text
 * @returns The detected obligation level, or 'shall' as default for ambiguous text
 */
export function classifyObligation(text: string): ObligationLevel {
  for (const { level, pattern } of OBLIGATION_PATTERNS) {
    if (pattern.test(text)) {
      return level;
    }
  }

  // Default: if no obligation keyword found, assume mandatory (conservative)
  return 'shall';
}

/**
 * Get all obligation keywords found in a text, useful for debugging
 * and for the obligation breakdown stats.
 */
export function findAllObligations(text: string): ObligationLevel[] {
  const found: ObligationLevel[] = [];
  for (const { level, pattern } of OBLIGATION_PATTERNS) {
    if (pattern.test(text)) {
      found.push(level);
    }
  }
  return found;
}

/**
 * Count obligation levels across an array of requirement texts.
 * Returns the breakdown object stored in shred_log.obligation_breakdown.
 */
export function countObligations(
  requirements: Array<{ obligationLevel: ObligationLevel }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const req of requirements) {
    const key = req.obligationLevel;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
