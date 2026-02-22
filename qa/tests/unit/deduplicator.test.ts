// qa/tests/unit/deduplicator.test.ts
// Purpose: Unit tests for requirement deduplication
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { deduplicateRequirements, computeSimilarity } from '@/lib/shredder/deduplicator';
import type { Requirement } from '@/lib/shredder/types';

function makeReq(overrides: Partial<Requirement> = {}): Requirement {
  return {
    id: 'L-001',
    rfpSection: 'L.1',
    page: 1,
    requirementText: 'The contractor shall provide a technical approach.',
    obligationLevel: 'shall',
    evalFactorMapping: '',
    responseStrategy: '',
    complianceStatus: '',
    ...overrides,
  };
}

describe('computeSimilarity', () => {
  it('returns 1.0 for identical texts', () => {
    const text = 'The contractor shall provide a technical approach document.';
    expect(computeSimilarity(text, text)).toBe(1);
  });

  it('returns high similarity for near-identical texts', () => {
    const a = 'The contractor shall provide a detailed technical approach.';
    const b = 'The contractor shall provide a comprehensive technical approach.';
    const sim = computeSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.6);
  });

  it('returns low similarity for unrelated texts', () => {
    const a = 'The contractor shall provide a technical approach.';
    const b = 'Past performance evaluations will consider contract size.';
    const sim = computeSimilarity(a, b);
    expect(sim).toBeLessThan(0.3);
  });

  it('returns 1.0 for two empty strings', () => {
    expect(computeSimilarity('', '')).toBe(1);
  });

  it('returns 0 when one string is empty', () => {
    expect(computeSimilarity('hello world testing', '')).toBe(0);
  });
});

describe('deduplicateRequirements', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateRequirements([])).toEqual([]);
  });

  it('returns single requirement unchanged', () => {
    const reqs = [makeReq()];
    const result = deduplicateRequirements(reqs);
    expect(result).toHaveLength(1);
  });

  it('removes exact duplicate requirements', () => {
    const reqs = [
      makeReq({ id: 'L-001', requirementText: 'The contractor shall provide a technical approach.' }),
      makeReq({ id: 'L-002', requirementText: 'The contractor shall provide a technical approach.' }),
    ];
    const result = deduplicateRequirements(reqs);
    expect(result).toHaveLength(1);
  });

  it('removes near-duplicate requirements from chunk overlap', () => {
    const reqs = [
      makeReq({
        id: 'L-001',
        requirementText: 'The contractor shall provide a detailed technical approach describing their methodology and tools.',
      }),
      makeReq({
        id: 'L-002',
        requirementText: 'The contractor shall provide a detailed technical approach describing their methodology and tools used.',
      }),
    ];
    const result = deduplicateRequirements(reqs);
    expect(result).toHaveLength(1);
    // Keeps the longer version
    expect(result[0].requirementText).toContain('tools used');
  });

  it('preserves distinct requirements', () => {
    const reqs = [
      makeReq({ id: 'L-001', requirementText: 'The contractor shall provide a technical approach.' }),
      makeReq({ id: 'L-002', requirementText: 'The offeror must submit past performance references.' }),
      makeReq({ id: 'M-001', requirementText: 'Proposals will be evaluated on technical merit.' }),
    ];
    const result = deduplicateRequirements(reqs);
    expect(result).toHaveLength(3);
  });

  it('renumbers IDs after deduplication', () => {
    const reqs = [
      makeReq({ id: 'L-001', requirementText: 'The contractor shall provide deliverable one.' }),
      makeReq({ id: 'L-002', requirementText: 'The contractor shall provide deliverable one.' }), // dup
      makeReq({ id: 'L-003', requirementText: 'The contractor must submit cost data separately.' }),
    ];
    const result = deduplicateRequirements(reqs);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('L-001');
    expect(result[1].id).toBe('L-002');
  });
});
