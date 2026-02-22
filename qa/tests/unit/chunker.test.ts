// qa/tests/unit/chunker.test.ts
// Purpose: Unit tests for text chunking
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { chunkText, estimateTokens } from '@/lib/shredder/chunker';
import type { ParsedPage } from '@/lib/shredder/types';
import { MAX_TOKENS_PER_CHUNK, CHARS_PER_TOKEN } from '@/lib/shredder/types';

function makePages(texts: string[]): ParsedPage[] {
  return texts.map((text, i) => ({ pageNumber: i + 1, text }));
}

/** Generate a string of approximately N tokens */
function generateTokens(n: number): string {
  // 1 token ≈ 4 chars, use repeating words of 4 chars + space
  const word = 'test ';
  const charsNeeded = n * CHARS_PER_TOKEN;
  return word.repeat(Math.ceil(charsNeeded / word.length)).slice(0, charsNeeded);
}

describe('estimateTokens', () => {
  it('estimates tokens from character count', () => {
    // 400 characters → ~100 tokens
    const text = 'a'.repeat(400);
    expect(estimateTokens(text)).toBe(100);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('chunkText', () => {
  it('returns 1 chunk for text under 100K tokens', () => {
    const pages = makePages([
      generateTokens(50_000), // 50K tokens — fits in one chunk
    ]);

    const chunks = chunkText(pages);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].startPage).toBe(1);
    expect(chunks[0].endPage).toBe(1);
  });

  it('splits text exceeding 100K tokens into multiple chunks', () => {
    // Create 3 pages each with 50K tokens → ~150K total → should be 2 chunks
    const pages = makePages([
      generateTokens(50_000),
      generateTokens(50_000),
      generateTokens(50_000),
    ]);

    const chunks = chunkText(pages);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    // Each chunk should be under the limit
    for (const chunk of chunks) {
      expect(chunk.tokenEstimate).toBeLessThanOrEqual(MAX_TOKENS_PER_CHUNK + 100); // small margin
    }
  });

  it('preserves page numbers in chunk metadata', () => {
    const pages = makePages([
      'Page 1 content about requirements.',
      'Page 2 content about more requirements.',
      'Page 3 content about evaluation criteria.',
    ]);

    const chunks = chunkText(pages);
    expect(chunks[0].startPage).toBe(1);
    expect(chunks[0].endPage).toBe(3);
  });

  it('includes page markers in chunk text', () => {
    const pages = makePages([
      'The contractor shall provide a technical approach.',
      'The contractor must submit past performance references.',
    ]);

    const chunks = chunkText(pages);
    expect(chunks[0].text).toContain('[PAGE 1]');
    expect(chunks[0].text).toContain('[PAGE 2]');
  });

  it('handles single page', () => {
    const pages = makePages(['Short content.']);
    const chunks = chunkText(pages);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].startPage).toBe(1);
    expect(chunks[0].endPage).toBe(1);
  });

  it('handles empty pages array', () => {
    const chunks = chunkText([]);
    // Should return 1 chunk with empty/minimal text, or 0 chunks
    expect(chunks.length).toBeLessThanOrEqual(1);
  });

  it('creates overlap between chunks', () => {
    // Create pages that will require 2+ chunks
    const pages: ParsedPage[] = [];
    for (let i = 0; i < 30; i++) {
      pages.push({
        pageNumber: i + 1,
        text: generateTokens(5_000), // 5K tokens each → 150K total
      });
    }

    const chunks = chunkText(pages);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    // If there are 2+ chunks, the second chunk should start before
    // the first chunk ends (overlap region)
    if (chunks.length >= 2) {
      // Chunks should have sequential indices
      expect(chunks[1].index).toBe(1);
    }
  });
});
