// src/lib/shredder/crossref.ts
// Purpose: Map Section L requirements to Section M evaluation factors
// Dependencies: ./types
// Test spec: qa/test-specs/core-product.md

import type { Requirement } from './types';

/** A cross-reference mapping between an L requirement and M evaluation factor */
export interface CrossReference {
  lReqId: string;
  lSection: string;
  lRequirementSummary: string;
  mSection: string;
  mEvalFactor: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Generate L-to-M cross-references by matching Section L requirements
 * to Section M evaluation factors.
 *
 * Matching strategy (in priority order):
 * 1. Explicit references: L requirement text mentions "M.x.x" or vice versa
 * 2. Section numbering alignment: L.4.3 maps to M.4.3 (common in DoD RFPs)
 * 3. Keyword similarity: matching domain keywords between L and M items
 *
 * @param requirements - All extracted requirements (both L and M)
 * @returns Array of cross-references and updated requirements with evalFactorMapping
 */
export function generateCrossReferences(
  requirements: Requirement[]
): { requirements: Requirement[]; crossRefs: CrossReference[] } {
  const lReqs = requirements.filter((r) => r.id.startsWith('L'));
  const mReqs = requirements.filter((r) => r.id.startsWith('M'));

  // If no M requirements, return as-is (no cross-ref possible)
  if (mReqs.length === 0) {
    return { requirements, crossRefs: [] };
  }

  const crossRefs: CrossReference[] = [];
  const updatedReqs = [...requirements];

  for (const lReq of lReqs) {
    const match = findBestMMatch(lReq, mReqs);
    if (match) {
      crossRefs.push({
        lReqId: lReq.id,
        lSection: lReq.rfpSection,
        lRequirementSummary: truncate(lReq.requirementText, 80),
        mSection: match.mReq.rfpSection,
        mEvalFactor: match.mReq.evalFactorMapping || match.mReq.rfpSection,
        confidence: match.confidence,
      });

      // Update the L requirement with its eval factor mapping
      const idx = updatedReqs.findIndex((r) => r.id === lReq.id);
      if (idx !== -1) {
        updatedReqs[idx] = {
          ...updatedReqs[idx],
          evalFactorMapping: `${match.mReq.rfpSection} — ${match.mReq.evalFactorMapping || match.mReq.requirementText.slice(0, 50)}`,
        };
      }
    }
  }

  return { requirements: updatedReqs, crossRefs };
}

interface MMatch {
  mReq: Requirement;
  confidence: 'high' | 'medium' | 'low';
  score: number;
}

/**
 * Find the best matching M requirement for a given L requirement.
 */
function findBestMMatch(
  lReq: Requirement,
  mReqs: Requirement[]
): MMatch | null {
  let bestMatch: MMatch | null = null;

  for (const mReq of mReqs) {
    let score = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Strategy 1: Explicit cross-reference in text
    const explicitScore = checkExplicitReference(lReq, mReq);
    if (explicitScore > 0) {
      score += explicitScore * 3;
      confidence = 'high';
    }

    // Strategy 2: Section numbering alignment (L.4.3 → M.4.3)
    const numberScore = checkSectionAlignment(lReq.rfpSection, mReq.rfpSection);
    if (numberScore > 0) {
      score += numberScore * 2;
      if (confidence !== 'high') confidence = 'medium';
    }

    // Strategy 3: Keyword similarity
    const keywordScore = checkKeywordSimilarity(lReq.requirementText, mReq.requirementText);
    score += keywordScore;
    if (keywordScore > 0.3 && confidence === 'low') {
      confidence = 'medium';
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { mReq, confidence, score };
    }
  }

  return bestMatch;
}

/**
 * Check for explicit M-section references in L requirement text,
 * or L-section references in M requirement text.
 */
function checkExplicitReference(lReq: Requirement, mReq: Requirement): number {
  let score = 0;

  // L text mentions M section: "as described in M.2.1"
  const mRef = mReq.rfpSection.replace(/\./g, '\\.');
  if (mRef && new RegExp(`\\b${mRef}\\b`, 'i').test(lReq.requirementText)) {
    score += 1;
  }

  // M text mentions L section
  const lRef = lReq.rfpSection.replace(/\./g, '\\.');
  if (lRef && new RegExp(`\\b${lRef}\\b`, 'i').test(mReq.requirementText)) {
    score += 1;
  }

  return score;
}

/**
 * Check if section numbers align (e.g., L.4.3 maps to M.4.3).
 * Common convention in federal RFPs where section numbering is parallel.
 */
function checkSectionAlignment(lSection: string, mSection: string): number {
  // Extract numeric parts: "L.4.3.2" → "4.3.2", "M.4.3.2" → "4.3.2"
  const lNums = lSection.replace(/^[LlMm]\.?/, '');
  const mNums = mSection.replace(/^[LlMm]\.?/, '');

  if (!lNums || !mNums) return 0;

  if (lNums === mNums) return 1.0;

  // Partial match: "4.3" starts with "4"
  const lParts = lNums.split('.');
  const mParts = mNums.split('.');
  if (lParts[0] === mParts[0]) return 0.5;

  return 0;
}

/**
 * Keyword similarity between L and M requirement texts.
 * Uses GovCon domain keywords for more meaningful matching.
 */
function checkKeywordSimilarity(lText: string, mText: string): number {
  const lKeywords = extractKeywords(lText);
  const mKeywords = extractKeywords(mText);

  if (lKeywords.size === 0 || mKeywords.size === 0) return 0;

  let overlap = 0;
  lKeywords.forEach((kw) => {
    if (mKeywords.has(kw)) overlap++;
  });

  const union = lKeywords.size + mKeywords.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

/** Extract meaningful keywords, filtering out stop words */
function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
  'can', 'her', 'was', 'one', 'our', 'out', 'has', 'have',
  'from', 'that', 'this', 'with', 'they', 'been', 'will',
  'each', 'make', 'like', 'into', 'than', 'them', 'then',
  'also', 'just', 'over', 'such', 'more', 'some', 'very',
  'shall', 'must', 'should', 'may', 'will', 'would', 'could',
  'offeror', 'contractor', 'government', 'proposal', 'required',
]);
