// src/lib/shredder/extractor.ts
// Purpose: Extract requirements from RFP text chunks via Claude API
// Dependencies: @anthropic-ai/sdk, ./types, ./extraction-prompt, ./obligation-classifier, ./deduplicator
// Test spec: qa/test-specs/core-product.md

import Anthropic from '@anthropic-ai/sdk';
import type { TextChunk, Requirement, ObligationLevel, DetectedSection } from './types';
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionPrompt,
  type RawExtractedRequirement,
} from './extraction-prompt';
import { classifyObligation } from './obligation-classifier';
import { deduplicateRequirements } from './deduplicator';

/** Valid obligation levels for validation */
const VALID_OBLIGATIONS: Set<string> = new Set([
  'shall', 'must', 'should', 'may', 'will', 'is required to', 'is expected to',
]);

/**
 * Extract requirements from text chunks using the Claude API.
 *
 * Sends each chunk to Claude Sonnet, parses the JSON response,
 * validates and normalizes the results, then deduplicates across
 * chunk boundaries.
 *
 * @param chunks - Text chunks from the chunker
 * @param sectionL - Detected Section L (may be null)
 * @param sectionM - Detected Section M (may be null)
 * @returns Deduplicated, numbered requirements array
 */
export async function extractRequirements(
  chunks: TextChunk[],
  sectionL: DetectedSection | null,
  sectionM: DetectedSection | null,
  onProgress?: (currentChunk: number, totalChunks: number) => void
): Promise<Requirement[]> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  // Process all chunks (could parallelize, but sequential is safer for rate limits)
  const allRaw: RawExtractedRequirement[] = [];

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const sectionType = determineSectionType(chunk, sectionL, sectionM);
    const userPrompt = buildExtractionPrompt(chunk.text, sectionType);

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 8192,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract text content from response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') continue;

      const parsed = parseExtractionResponse(textContent.text);
      allRaw.push(...parsed);

      if (onProgress) {
        onProgress(index + 1, chunks.length);
      }
    } catch (error) {
      // Log error but continue with other chunks — partial extraction
      // is better than no extraction
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExtractionError(
        `Claude API extraction failed for chunk ${chunk.index}: ${message}`,
        'EXTRACTION_API_FAILED'
      );
    }
  }

  // Convert raw extractions to typed Requirements
  const requirements = allRaw.map((raw, index) =>
    normalizeRequirement(raw, index, sectionL, sectionM)
  );

  // Deduplicate across chunk boundaries
  return deduplicateRequirements(requirements);
}

/**
 * Determine if a chunk falls within Section L, M, or both,
 * based on page ranges.
 */
function determineSectionType(
  chunk: TextChunk,
  sectionL: DetectedSection | null,
  sectionM: DetectedSection | null
): 'L' | 'M' | 'both' {
  const inL = sectionL &&
    chunk.startPage <= sectionL.endPage &&
    chunk.endPage >= sectionL.startPage;
  const inM = sectionM &&
    chunk.startPage <= sectionM.endPage &&
    chunk.endPage >= sectionM.startPage;

  if (inL && inM) return 'both';
  if (inM) return 'M';
  return 'L';
}

/**
 * Parse Claude's JSON response into structured requirements.
 * Handles edge cases: markdown code fences, extra whitespace, partial JSON.
 */
export function parseExtractionResponse(responseText: string): RawExtractedRequirement[] {
  // Strip markdown code fences if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate each item has required fields
    return parsed.filter(
      (item: unknown): item is RawExtractedRequirement =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).requirementText === 'string' &&
        (item as Record<string, unknown>).requirementText !== ''
    );
  } catch {
    // JSON parse failed — try to salvage partial results
    return attemptPartialParse(cleaned);
  }
}

/**
 * Attempt to extract partial results from malformed JSON.
 * Last resort — looks for individual JSON objects.
 */
function attemptPartialParse(text: string): RawExtractedRequirement[] {
  const results: RawExtractedRequirement[] = [];
  const objectPattern = /\{[^{}]*"requirementText"\s*:\s*"[^"]+[^{}]*\}/g;
  let match;

  while ((match = objectPattern.exec(text)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      if (obj.requirementText) {
        results.push(obj);
      }
    } catch {
      // Skip malformed individual object
    }
  }

  return results;
}

/**
 * Normalize a raw extracted requirement into the typed Requirement format.
 * Validates and corrects obligation levels, assigns IDs.
 */
function normalizeRequirement(
  raw: RawExtractedRequirement,
  index: number,
  sectionL: DetectedSection | null,
  sectionM: DetectedSection | null
): Requirement {
  // Determine section prefix for ID
  const isM = raw.rfpSection?.toUpperCase().startsWith('M') ||
    raw.evalFactor?.trim().length > 0;
  const prefix = isM ? 'M' : 'L';
  const id = `${prefix}-${String(index + 1).padStart(3, '0')}`;

  // Validate/correct obligation level
  const rawObligation = raw.obligationLevel?.toLowerCase().trim() || '';
  const obligation: ObligationLevel = VALID_OBLIGATIONS.has(rawObligation)
    ? (rawObligation as ObligationLevel)
    : classifyObligation(raw.requirementText);

  // Build eval factor mapping
  let evalFactorMapping = '';
  if (isM && raw.evalFactor) {
    evalFactorMapping = raw.evalFactor;
  } else if (isM && raw.rfpSection) {
    evalFactorMapping = raw.rfpSection;
  } else if (!isM && sectionM) {
    // For L requirements, leave eval factor empty — cross-ref fills it in Phase 4
    evalFactorMapping = '';
  }

  return {
    id,
    rfpSection: raw.rfpSection || prefix,
    page: typeof raw.page === 'number' ? raw.page : 0,
    requirementText: raw.requirementText.trim(),
    obligationLevel: obligation,
    evalFactorMapping,
    responseStrategy: '',
    complianceStatus: '',
  };
}

/** Custom error class for extraction failures */
export class ExtractionError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
  }
}
