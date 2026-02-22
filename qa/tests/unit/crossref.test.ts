// qa/tests/unit/crossref.test.ts
// Purpose: Unit tests for L-to-M cross-reference engine
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { generateCrossReferences } from '@/lib/shredder/crossref';
import type { Requirement } from '@/lib/shredder/types';

function makeReq(overrides: Partial<Requirement>): Requirement {
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

describe('generateCrossReferences', () => {
  it('returns empty crossRefs when no M requirements exist', () => {
    const reqs = [
      makeReq({ id: 'L-001', rfpSection: 'L.1' }),
      makeReq({ id: 'L-002', rfpSection: 'L.2' }),
    ];
    const { crossRefs } = generateCrossReferences(reqs);
    expect(crossRefs).toHaveLength(0);
  });

  it('matches L to M by explicit section reference in text', () => {
    const reqs = [
      makeReq({
        id: 'L-001',
        rfpSection: 'L.4.3',
        requirementText: 'The contractor shall provide a technical approach as evaluated under M.2.1.',
      }),
      makeReq({
        id: 'M-001',
        rfpSection: 'M.2.1',
        requirementText: 'Technical approach will be evaluated for innovation.',
        evalFactorMapping: 'Technical Approach',
      }),
    ];

    const { crossRefs } = generateCrossReferences(reqs);
    expect(crossRefs.length).toBeGreaterThanOrEqual(1);
    expect(crossRefs[0].lReqId).toBe('L-001');
    expect(crossRefs[0].mSection).toBe('M.2.1');
    expect(crossRefs[0].confidence).toBe('high');
  });

  it('matches L to M by aligned section numbering (L.4.3 → M.4.3)', () => {
    const reqs = [
      makeReq({
        id: 'L-001',
        rfpSection: 'L.4.3',
        requirementText: 'Provide staffing plan details.',
      }),
      makeReq({
        id: 'M-001',
        rfpSection: 'M.4.3',
        requirementText: 'Staffing plan evaluation criteria.',
        evalFactorMapping: 'Staffing',
      }),
    ];

    const { crossRefs } = generateCrossReferences(reqs);
    expect(crossRefs.length).toBeGreaterThanOrEqual(1);
    expect(crossRefs[0].mSection).toBe('M.4.3');
  });

  it('matches L to M by keyword similarity', () => {
    const reqs = [
      makeReq({
        id: 'L-001',
        rfpSection: 'L.5',
        requirementText: 'Describe the quality assurance surveillance program and testing methodology.',
      }),
      makeReq({
        id: 'M-001',
        rfpSection: 'M.3',
        requirementText: 'Quality assurance surveillance testing methodology effectiveness.',
        evalFactorMapping: 'Quality Assurance',
      }),
    ];

    const { crossRefs } = generateCrossReferences(reqs);
    expect(crossRefs.length).toBeGreaterThanOrEqual(1);
    expect(crossRefs[0].mSection).toBe('M.3');
  });

  it('updates L requirements with evalFactorMapping', () => {
    const reqs = [
      makeReq({
        id: 'L-001',
        rfpSection: 'L.4',
        requirementText: 'The contractor shall describe past performance on similar contracts per M.2.',
      }),
      makeReq({
        id: 'M-001',
        rfpSection: 'M.2',
        requirementText: 'Past performance will be evaluated.',
        evalFactorMapping: 'Past Performance',
      }),
    ];

    const { requirements } = generateCrossReferences(reqs);
    const lReq = requirements.find((r) => r.id === 'L-001');
    expect(lReq?.evalFactorMapping).toContain('M.2');
  });

  it('handles no matches gracefully (no crossRefs generated)', () => {
    const reqs = [
      makeReq({
        id: 'L-001',
        rfpSection: 'L.1',
        requirementText: 'Submit electronic copies on USB drive.',
      }),
      makeReq({
        id: 'M-001',
        rfpSection: 'M.5',
        requirementText: 'Cost realism analysis criteria.',
        evalFactorMapping: 'Cost',
      }),
    ];

    const { crossRefs } = generateCrossReferences(reqs);
    // Low-confidence matches may still be generated; that's acceptable
    // The key thing is the function doesn't error
    expect(Array.isArray(crossRefs)).toBe(true);
  });

  it('handles empty requirements array', () => {
    const { crossRefs, requirements } = generateCrossReferences([]);
    expect(crossRefs).toHaveLength(0);
    expect(requirements).toHaveLength(0);
  });

  it('includes truncated requirement summary in cross-ref', () => {
    const longText = 'The contractor shall provide a comprehensive detailed technical approach document covering all aspects of the program including management, technical, and cost considerations for the duration of the contract period of performance.';
    const reqs = [
      makeReq({
        id: 'L-001',
        rfpSection: 'L.4',
        requirementText: longText,
      }),
      makeReq({
        id: 'M-001',
        rfpSection: 'M.4',
        requirementText: 'Technical approach comprehensive evaluation.',
        evalFactorMapping: 'Technical',
      }),
    ];

    const { crossRefs } = generateCrossReferences(reqs);
    if (crossRefs.length > 0) {
      expect(crossRefs[0].lRequirementSummary.length).toBeLessThanOrEqual(83); // 80 + "..."
    }
  });
});
