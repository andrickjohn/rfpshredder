// src/lib/shredder/deduplicator.ts
// Purpose: Deduplicate requirements from overlapping chunk boundaries
// Dependencies: ./types
// Test spec: qa/test-specs/core-product.md

import type { Requirement } from './types';

/**
 * Similarity threshold for considering two requirements as duplicates.
 * 0.85 = 85% of words overlap.
 */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Deduplicate requirements that may appear in overlapping regions
 * between adjacent chunks. Uses text similarity to detect duplicates
 * rather than exact matching, since Claude may phrase the same
 * requirement slightly differently across chunks.
 *
 * When duplicates are found, the version from the earlier chunk is kept
 * (it has more surrounding context for accurate extraction).
 *
 * @param requirements - All requirements from all chunks, in chunk order
 * @returns Deduplicated requirements array
 */
export function deduplicateRequirements(requirements: Requirement[]): Requirement[] {
  if (requirements.length <= 1) return requirements;

  const deduplicated: Requirement[] = [];
  const seen = new Set<number>(); // indices of requirements already consumed

  for (let i = 0; i < requirements.length; i++) {
    if (seen.has(i)) continue;

    let best = requirements[i];

    // Compare with subsequent requirements for duplicates
    for (let j = i + 1; j < requirements.length; j++) {
      if (seen.has(j)) continue;

      const similarity = computeSimilarity(
        best.requirementText,
        requirements[j].requirementText
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        // Mark duplicate as consumed
        seen.add(j);

        // Keep the version with more text (likely more context)
        if (requirements[j].requirementText.length > best.requirementText.length) {
          best = requirements[j];
        }
      }
    }

    deduplicated.push(best);
  }

  // Re-assign IDs sequentially after deduplication
  return deduplicated.map((req, index) => ({
    ...req,
    id: renumberId(req.id, index + 1),
  }));
}

/**
 * Compute word-level Jaccard similarity between two texts.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
export function computeSimilarity(textA: string, textB: string): number {
  const wordsA = normalizeAndTokenize(textA);
  const wordsB = normalizeAndTokenize(textB);

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) intersection++;
  });

  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Normalize text and convert to a set of lowercase words.
 * Strips punctuation and common stop words for better matching.
 */
function normalizeAndTokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Renumber an ID like "L-001" or "M-005" with a new sequence number.
 */
function renumberId(originalId: string, newNumber: number): string {
  const prefix = originalId.match(/^[A-Z]+-?/)?.[0] || 'L-';
  return `${prefix}${String(newNumber).padStart(3, '0')}`;
}

/** Common English stop words to exclude from similarity comparison */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
  'can', 'her', 'was', 'one', 'our', 'out', 'has', 'have',
  'from', 'that', 'this', 'with', 'they', 'been', 'will',
  'each', 'make', 'like', 'into', 'than', 'them', 'then',
  'also', 'just', 'over', 'such', 'more', 'some', 'very',
]);
