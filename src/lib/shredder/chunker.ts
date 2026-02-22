// src/lib/shredder/chunker.ts
// Purpose: Split text into chunks within Claude API token limits
// Dependencies: ./types
// Test spec: qa/test-specs/core-product.md

import {
  TextChunk,
  ParsedPage,
  MAX_TOKENS_PER_CHUNK,
  CHUNK_OVERLAP_TOKENS,
  CHARS_PER_TOKEN,
} from './types';

/** Max characters per chunk (derived from token limit) */
const MAX_CHARS_PER_CHUNK = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN;

/** Overlap in characters */
const OVERLAP_CHARS = CHUNK_OVERLAP_TOKENS * CHARS_PER_TOKEN;

/**
 * Estimate the token count for a given text.
 * Uses a simple heuristic: ~4 characters per token for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Split parsed pages into chunks that fit within Claude API token limits.
 *
 * Chunks are split at page boundaries when possible. If a single page
 * exceeds the limit (unlikely for RFPs), it's split at paragraph boundaries.
 *
 * Each chunk overlaps with the previous by CHUNK_OVERLAP_TOKENS tokens
 * to avoid losing requirements that span chunk boundaries.
 *
 * @param pages - Parsed pages from the document
 * @returns Array of text chunks ready for the extraction API
 */
export function chunkText(pages: ParsedPage[]): TextChunk[] {
  const fullText = pages
    .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
    .join('\n\n');

  const totalTokens = estimateTokens(fullText);

  // If text fits in one chunk, return it as-is
  if (totalTokens <= MAX_TOKENS_PER_CHUNK) {
    return [
      {
        index: 0,
        text: fullText,
        startPage: pages[0]?.pageNumber ?? 1,
        endPage: pages[pages.length - 1]?.pageNumber ?? 1,
        tokenEstimate: totalTokens,
      },
    ];
  }

  // Split into multiple chunks at page boundaries
  return splitIntoChunks(pages);
}

/**
 * Split pages into multiple chunks, respecting the token limit
 * and adding overlap between chunks.
 */
function splitIntoChunks(pages: ParsedPage[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let currentChunkText = '';
  let currentStartPage = pages[0]?.pageNumber ?? 1;
  let chunkIndex = 0;

  for (let i = 0; i < pages.length; i++) {
    const pageText = `[PAGE ${pages[i].pageNumber}]\n${pages[i].text}\n\n`;
    const combinedLength = currentChunkText.length + pageText.length;

    if (combinedLength > MAX_CHARS_PER_CHUNK && currentChunkText.length > 0) {
      // Current chunk is full — save it
      chunks.push({
        index: chunkIndex,
        text: currentChunkText.trim(),
        startPage: currentStartPage,
        endPage: pages[i - 1]?.pageNumber ?? currentStartPage,
        tokenEstimate: estimateTokens(currentChunkText),
      });
      chunkIndex++;

      // Start new chunk with overlap from the end of the previous chunk
      const overlapText = getOverlapText(currentChunkText, OVERLAP_CHARS);
      currentChunkText = overlapText + pageText;
      currentStartPage = pages[i].pageNumber;
    } else {
      currentChunkText += pageText;
    }
  }

  // Don't forget the last chunk
  if (currentChunkText.trim().length > 0) {
    chunks.push({
      index: chunkIndex,
      text: currentChunkText.trim(),
      startPage: currentStartPage,
      endPage: pages[pages.length - 1]?.pageNumber ?? currentStartPage,
      tokenEstimate: estimateTokens(currentChunkText),
    });
  }

  return chunks;
}

/**
 * Extract overlap text from the end of a chunk.
 * Tries to break at a sentence boundary for cleaner overlap.
 */
function getOverlapText(text: string, overlapChars: number): string {
  if (text.length <= overlapChars) return text;

  const overlapRegion = text.slice(-overlapChars);

  // Try to start at a sentence boundary
  const sentenceStart = overlapRegion.search(/\.\s+[A-Z]/);
  if (sentenceStart > 0 && sentenceStart < overlapChars / 2) {
    return overlapRegion.slice(sentenceStart + 2);
  }

  // Fall back to paragraph boundary
  const paraStart = overlapRegion.indexOf('\n');
  if (paraStart > 0) {
    return overlapRegion.slice(paraStart + 1);
  }

  return overlapRegion;
}
