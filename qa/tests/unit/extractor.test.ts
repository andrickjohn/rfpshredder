// qa/tests/unit/extractor.test.ts
// Purpose: Unit tests for the extraction response parser (no API calls needed)
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { parseExtractionResponse } from '@/lib/shredder/extractor';
import { buildExtractionPrompt, EXTRACTION_SYSTEM_PROMPT } from '@/lib/shredder/extraction-prompt';

describe('parseExtractionResponse', () => {
  it('parses a clean JSON array response', () => {
    const response = JSON.stringify([
      {
        rfpSection: 'L.4.3.1',
        page: 45,
        requirementText: 'The contractor shall provide a technical approach.',
        obligationLevel: 'shall',
        evalFactor: '',
      },
      {
        rfpSection: 'L.4.3.2',
        page: 46,
        requirementText: 'The offeror must submit three copies.',
        obligationLevel: 'must',
        evalFactor: '',
      },
    ]);

    const result = parseExtractionResponse(response);
    expect(result).toHaveLength(2);
    expect(result[0].rfpSection).toBe('L.4.3.1');
    expect(result[0].requirementText).toBe('The contractor shall provide a technical approach.');
    expect(result[1].obligationLevel).toBe('must');
  });

  it('strips markdown code fences from response', () => {
    const response = '```json\n[{"rfpSection": "L.1", "page": 1, "requirementText": "Shall submit.", "obligationLevel": "shall", "evalFactor": ""}]\n```';
    const result = parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].requirementText).toBe('Shall submit.');
  });

  it('strips bare code fences from response', () => {
    const response = '```\n[{"rfpSection": "M.1", "page": 10, "requirementText": "Will evaluate.", "obligationLevel": "will", "evalFactor": "Technical"}]\n```';
    const result = parseExtractionResponse(response);
    expect(result).toHaveLength(1);
  });

  it('handles empty array response', () => {
    const result = parseExtractionResponse('[]');
    expect(result).toHaveLength(0);
  });

  it('filters out entries missing requirementText', () => {
    const response = JSON.stringify([
      { rfpSection: 'L.1', page: 1, requirementText: 'Valid requirement.', obligationLevel: 'shall', evalFactor: '' },
      { rfpSection: 'L.2', page: 2, obligationLevel: 'must', evalFactor: '' },
      { rfpSection: 'L.3', page: 3, requirementText: '', obligationLevel: 'should', evalFactor: '' },
    ]);
    const result = parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].requirementText).toBe('Valid requirement.');
  });

  it('handles non-array JSON (returns empty)', () => {
    const result = parseExtractionResponse('{"error": "something went wrong"}');
    expect(result).toHaveLength(0);
  });

  it('handles completely invalid JSON with partial salvage', () => {
    const response = 'Here are the requirements:\n{"rfpSection": "L.1", "page": 1, "requirementText": "The contractor shall comply.", "obligationLevel": "shall", "evalFactor": ""}\nMore text here';
    const result = parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].requirementText).toBe('The contractor shall comply.');
  });

  it('handles empty/whitespace response', () => {
    const result = parseExtractionResponse('   ');
    expect(result).toHaveLength(0);
  });
});

describe('buildExtractionPrompt', () => {
  it('includes section L context for L chunks', () => {
    const prompt = buildExtractionPrompt('test text', 'L');
    expect(prompt).toContain('Section L');
    expect(prompt).toContain('Instructions to Offerors');
    expect(prompt).toContain('test text');
  });

  it('includes section M context for M chunks', () => {
    const prompt = buildExtractionPrompt('test text', 'M');
    expect(prompt).toContain('Section M');
    expect(prompt).toContain('Evaluation Criteria');
  });

  it('includes both context for mixed chunks', () => {
    const prompt = buildExtractionPrompt('test text', 'both');
    expect(prompt).toContain('both Section L and Section M');
  });

  it('includes the JSON schema instructions', () => {
    const prompt = buildExtractionPrompt('test text', 'L');
    expect(prompt).toContain('rfpSection');
    expect(prompt).toContain('requirementText');
    expect(prompt).toContain('obligationLevel');
  });
});

describe('EXTRACTION_SYSTEM_PROMPT', () => {
  it('instructs extraction of every requirement', () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('EVERY requirement');
  });

  it('instructs JSON-only response', () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('ONLY a JSON array');
  });

  it('lists all obligation levels', () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('shall');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('must');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('should');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('may');
  });
});
