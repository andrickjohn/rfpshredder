// qa/tests/unit/obligation-classifier.test.ts
// Purpose: Unit tests for obligation level classification
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { classifyObligation, countObligations } from '@/lib/shredder/obligation-classifier';

describe('classifyObligation', () => {
  it('classifies "shall" as shall', () => {
    expect(classifyObligation('The contractor shall provide a technical approach.')).toBe('shall');
  });

  it('classifies "must" as must', () => {
    expect(classifyObligation('The offeror must submit three copies.')).toBe('must');
  });

  it('classifies "should" as should', () => {
    expect(classifyObligation('The contractor should consider past performance.')).toBe('should');
  });

  it('classifies "may" as may', () => {
    expect(classifyObligation('The contractor may optionally include appendices.')).toBe('may');
  });

  it('classifies "will" as will', () => {
    expect(classifyObligation('The Government will evaluate proposals based on criteria.')).toBe('will');
  });

  it('classifies "is required to" as is required to', () => {
    expect(classifyObligation('The offeror is required to demonstrate relevant experience.')).toBe('is required to');
  });

  it('classifies "is expected to" as is expected to', () => {
    expect(classifyObligation('The contractor is expected to maintain a quality plan.')).toBe('is expected to');
  });

  it('prioritizes "shall" over "may" when both appear', () => {
    expect(classifyObligation('The contractor shall provide docs and may include extras.')).toBe('shall');
  });

  it('prioritizes "is required to" over "shall"', () => {
    expect(classifyObligation('The offeror is required to demonstrate and shall provide evidence.')).toBe('is required to');
  });

  it('defaults to "shall" for text with no obligation keyword', () => {
    expect(classifyObligation('Technical approach scoring criteria.')).toBe('shall');
  });

  it('handles case-insensitive matching', () => {
    expect(classifyObligation('The contractor SHALL provide all deliverables.')).toBe('shall');
    expect(classifyObligation('The contractor MUST comply with regulations.')).toBe('must');
  });

  it('handles obligation keyword in various sentence positions', () => {
    expect(classifyObligation('Proposals shall be submitted by the due date.')).toBe('shall');
    expect(classifyObligation('All submissions must include a cover page.')).toBe('must');
  });
});

describe('countObligations', () => {
  it('counts obligation levels correctly', () => {
    const requirements = [
      { obligationLevel: 'shall' as const },
      { obligationLevel: 'shall' as const },
      { obligationLevel: 'must' as const },
      { obligationLevel: 'should' as const },
      { obligationLevel: 'may' as const },
    ];
    const counts = countObligations(requirements);
    expect(counts).toEqual({ shall: 2, must: 1, should: 1, may: 1 });
  });

  it('returns empty object for empty array', () => {
    expect(countObligations([])).toEqual({});
  });
});
