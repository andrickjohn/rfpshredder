// qa/tests/unit/section-detector.test.ts
// Purpose: Unit tests for Section L/M detection in RFP text
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { detectSections } from '@/lib/shredder/section-detector';
import type { ParsedPage } from '@/lib/shredder/types';

function makePages(texts: string[]): ParsedPage[] {
  return texts.map((text, i) => ({ pageNumber: i + 1, text }));
}

describe('detectSections', () => {
  it('detects standard Section L and Section M', () => {
    const pages = makePages([
      'Cover page content here',
      'SECTION L — Instructions to Offerors\nL.1 General Instructions\nThe contractor shall provide...',
      'L.2 Technical Approach\nL.2.1 The offeror shall describe...',
      'SECTION M — Evaluation Criteria\nM.1 Technical Evaluation\nProposals will be evaluated...',
      'M.2 Past Performance\nOfferors shall provide references...',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).not.toBeNull();
    expect(result.sectionM).not.toBeNull();
    expect(result.sectionL?.type).toBe('L');
    expect(result.sectionM?.type).toBe('M');
    expect(result.warnings).toHaveLength(0);
  });

  it('detects lowercase "Section L" and "Section M"', () => {
    const pages = makePages([
      'Section L – Instructions to Offerors\nThe contractor shall...',
      'Section M – Evaluation Criteria\nProposals will be...',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).not.toBeNull();
    expect(result.sectionM).not.toBeNull();
  });

  it('detects "Part L" and "Part M" format', () => {
    const pages = makePages([
      'Part L: Instructions to Offerors\nThe contractor shall...',
      'Part M: Evaluation Criteria\nProposals will be...',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).not.toBeNull();
    expect(result.sectionM).not.toBeNull();
  });

  it('returns error when neither section found', () => {
    const pages = makePages([
      'This is just a random document with no RFP sections.',
      'More random content about procurement but no Section L or M.',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).toBeNull();
    expect(result.sectionM).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Neither Section L');
  });

  it('handles Section L without Section M (warning but proceeds)', () => {
    const pages = makePages([
      'SECTION L — Instructions to Offerors\nThe contractor shall provide all required documentation.',
      'SECTION N — Other Provisions\nSome other content.',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).not.toBeNull();
    expect(result.sectionM).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Section M');
  });

  it('handles Section M without Section L (warning but proceeds)', () => {
    const pages = makePages([
      'Some preamble content.',
      'SECTION M — Evaluation Criteria\nProposals will be evaluated based on...',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).toBeNull();
    expect(result.sectionM).not.toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Section L');
  });

  it('sets correct page boundaries for sections', () => {
    const pages = makePages([
      'Cover page',
      'Table of contents',
      'SECTION L — Instructions\nL.1 The contractor shall...',
      'L.2 Additional requirements...',
      'SECTION M — Evaluation\nM.1 Technical approach...',
      'M.2 Past performance...',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL).not.toBeNull();
    expect(result.sectionL!.startPage).toBe(3);
    expect(result.sectionM).not.toBeNull();
    expect(result.sectionM!.startPage).toBe(5);
  });

  it('extracts section text content', () => {
    const pages = makePages([
      'SECTION L — Instructions to Offerors\nL.1 The contractor shall provide a technical approach.',
      'SECTION M — Evaluation Criteria\nM.1 Proposals will be evaluated.',
    ]);

    const result = detectSections(pages);
    expect(result.sectionL?.text).toContain('contractor shall provide');
    expect(result.sectionM?.text).toContain('evaluated');
  });
});
