// src/lib/shredder/section-detector.ts
// Purpose: Detect Section L (Instructions) and Section M (Evaluation) in RFP text
// Dependencies: ./types
// Test spec: qa/test-specs/core-product.md

import { DetectedSection, SectionDetectionResult, ParsedPage } from './types';

/**
 * Regex patterns for detecting Section L and Section M.
 * Handles various RFP formatting conventions:
 * - "Section L", "SECTION L", "Part L"
 * - With or without titles: "Section L — Instructions to Offerors"
 * - Subsections: "L.1", "L.4.3.2"
 */
const SECTION_L_PATTERNS = [
  // Standard "Section L" with optional title
  /(?:^|\n)\s*(?:SECTION|Section|PART|Part)\s+L[\s.:\-–—]+(.+?)(?:\n|$)/i,
  // Just "SECTION L" on its own line
  /(?:^|\n)\s*(?:SECTION|Section|PART|Part)\s+L\s*$/im,
  // "L. Instructions" or "L – Instructions"
  /(?:^|\n)\s*L[\s.:\-–—]+(?:Instructions|INSTRUCTIONS)\s/im,
  // Volume L pattern
  /(?:^|\n)\s*(?:VOLUME|Volume)\s+(?:III|IV|3|4)[\s.:\-–—]+.*(?:Instructions|INSTRUCTIONS)/im,
  // FAR Clause pattern for Instructions (e.g. 52.212-1 Instructions to Offerors)
  /(?:^|\n)\s*(?:\d{2}\.\d{3}-\d|\d+\.\d+)\s+(?:Instructions\s+to\s+Offerors)/im,
];

const SECTION_M_PATTERNS = [
  /(?:^|\n)\s*(?:SECTION|Section|PART|Part)\s+M[\s.:\-–—]+(.+?)(?:\n|$)/i,
  /(?:^|\n)\s*(?:SECTION|Section|PART|Part)\s+M\s*$/im,
  /(?:^|\n)\s*M[\s.:\-–—]+(?:Evaluation|EVALUATION)\s/im,
  /(?:^|\n)\s*(?:VOLUME|Volume)\s+(?:III|IV|3|4)[\s.:\-–—]+.*(?:Evaluation|EVALUATION)/im,
  // FAR Clause pattern for Evaluation (e.g. 52.212-2 Evaluation or 15.304 Evaluation factors)
  /(?:^|\n)\s*(?:\d{2}\.\d{3}-\d|\d+\.\d+)\s+(?:Evaluation(?:\s+factors)?)/im,
];

/** Pattern to detect subsection references like L.4.3.2 or M.2.1 */
const SUBSECTION_L_PATTERN = /\bL\.[\d.]+/g;
const SUBSECTION_M_PATTERN = /\bM\.[\d.]+/g;

/**
 * Detect Section L and Section M in parsed RFP text.
 *
 * @param pages - Array of parsed pages with text
 * @returns Detection result with section boundaries, or warnings if not found
 */
export function detectSections(pages: ParsedPage[]): SectionDetectionResult {
  const fullText = pages.map((p) => p.text).join('\n\n');
  const warnings: string[] = [];

  const sectionL = findSection('L', SECTION_L_PATTERNS, pages, fullText);
  const sectionM = findSection('M', SECTION_M_PATTERNS, pages, fullText);

  if (!sectionL && !sectionM) {
    return {
      sectionL: null,
      sectionM: null,
      otherSections: [],
      warnings: [
        'Neither Section L (Instructions) nor Section M (Evaluation) were found. ' +
        'This document may not be a standard RFP, or the sections may use non-standard formatting.',
      ],
    };
  }

  if (!sectionL) {
    warnings.push(
      'Section L (Instructions to Offerors) was not found. ' +
      'Extraction will proceed with Section M only.'
    );
  }

  if (!sectionM) {
    warnings.push(
      'Section M (Evaluation Criteria) was not found. ' +
      'The compliance matrix will be generated without cross-references to evaluation factors.'
    );
  }

  return {
    sectionL,
    sectionM,
    otherSections: [],
    warnings,
  };
}

/**
 * Find a specific section (L or M) in the document.
 * Searches for section headers, then extracts text from that point
 * to the start of the next major section.
 */
function findSection(
  type: 'L' | 'M',
  patterns: RegExp[],
  pages: ParsedPage[],
  fullText: string
): DetectedSection | null {
  // Try each pattern until we find a match
  let matchIndex = -1;
  let matchTitle = '';

  for (const pattern of patterns) {
    const match = pattern.exec(fullText);
    if (match) {
      matchIndex = match.index;
      matchTitle = match[1]?.trim() || `Section ${type}`;
      break;
    }
  }

  if (matchIndex === -1) return null;

  // Find which page contains the section header by searching each page directly.
  // This avoids fragile character-offset math across page join separators.
  let startPage = pages[pages.length - 1]?.pageNumber ?? 1;
  for (const page of pages) {
    const hasMatch = patterns.some((p) => new RegExp(p.source, p.flags).test(page.text));
    if (hasMatch) {
      startPage = page.pageNumber;
      break;
    }
  }

  // Find the end of this section: look for the next major section header
  const nextSectionPattern = type === 'L'
    ? /\n\s*(?:SECTION|Section|PART|Part)\s+(?:M|N|O|[0-9])/im
    : /\n\s*(?:SECTION|Section|PART|Part)\s+(?:N|O|P|[0-9])/im;

  const afterMatch = fullText.slice(matchIndex + 1);
  const nextMatch = nextSectionPattern.exec(afterMatch);

  const sectionEnd = nextMatch
    ? matchIndex + 1 + nextMatch.index
    : fullText.length;

  const sectionText = fullText.slice(matchIndex, sectionEnd).trim();

  // Find which page the section ends on.
  // The section ends at the page just before the next major section starts.
  // Default: last page of the document.
  let endPage = pages[pages.length - 1]?.pageNumber ?? 1;
  if (nextMatch) {
    const nextSectionText = afterMatch.slice(nextMatch.index).trim();
    // Search backwards from the end of the document for the page that
    // contains text just before the next section
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i].text.includes(nextSectionText.slice(0, 20))) {
        endPage = Math.max(pages[i].pageNumber - 1, startPage);
        break;
      }
    }
  }

  // Determine section reference
  const reference = type === 'L' ? findFirstSubsection(sectionText, SUBSECTION_L_PATTERN) || 'L'
    : findFirstSubsection(sectionText, SUBSECTION_M_PATTERN) || 'M';

  return {
    type,
    title: matchTitle,
    reference,
    startPage,
    endPage,
    text: sectionText,
  };
}

/** Find the first subsection reference in text */
function findFirstSubsection(text: string, pattern: RegExp): string | null {
  const match = pattern.exec(text);
  return match ? match[0] : null;
}
