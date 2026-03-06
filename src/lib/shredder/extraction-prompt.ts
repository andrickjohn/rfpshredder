// src/lib/shredder/extraction-prompt.ts
// Purpose: Prompt templates for Claude API requirement extraction
// Dependencies: none
// Test spec: qa/test-specs/core-product.md

/**
 * System prompt for Claude API extraction.
 * Instructs Claude to extract structured requirements from RFP text.
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are a government contracting compliance analyst. Your job is to extract every requirement from RFP (Request for Proposal) sections, specifically Section L (Instructions to Offerors) and Section M (Evaluation Criteria).

You must identify:
1. Every discrete requirement statement
2. The obligation level (shall, must, should, may, will, "is required to", "is expected to")
3. The RFP section reference (e.g., L.4.3.2, M.2.1)
4. The page number where the requirement appears
5. A brief response strategy for Section L requirements
6. The relevant Section M evaluation factor for Section L requirements (if identifiable)

CRITICAL RULES:
- Extract EVERY requirement, no matter how minor. Missing a requirement could cost a contractor the award.
- Each requirement should be a single, self-contained statement.
- If a paragraph contains multiple requirements, split them into separate entries.
- Preserve the exact obligation language (shall, must, should, etc.).
- Include the full requirement text, not a summary.
- If page numbers appear as [PAGE N] markers, use them. Otherwise estimate from context.
- For Section M requirements, note the evaluation factor/subfactor name.
- Do NOT include headers, footers, table of contents entries, or boilerplate as requirements.
- Do NOT include general informational statements that don't impose an obligation.

Respond with ONLY a JSON array. No markdown, no explanation, no preamble.`;

/**
 * Build the user prompt for a given text chunk.
 * Includes the section type context to guide extraction.
 */
export function buildExtractionPrompt(
  chunkText: string,
  sectionType: 'L' | 'M' | 'both'
): string {
  const sectionContext =
    sectionType === 'L'
      ? 'This text is from Section L (Instructions to Offerors). Focus on extracting proposal submission requirements.'
      : sectionType === 'M'
        ? 'This text is from Section M (Evaluation Criteria). Focus on extracting evaluation factors and scoring criteria.'
        : 'This text contains both Section L and Section M content. Extract requirements from both sections.';

  const hasL = sectionType === 'L' || sectionType === 'both';

  const lSpecificFields = hasL
    ? `- "evalFactorHint": for Section L only — if this requirement clearly supports a specific Section M evaluation factor (e.g., "Technical Approach", "Past Performance", "Key Personnel", "Management Approach"), name it briefly. If not identifiable, use empty string.
- "responseStrategy": for Section L only — write ONE concise sentence (max 20 words) describing what the offeror must address in their proposal response to satisfy this requirement. For Section M items, use empty string.`
    : `- "evalFactorHint": empty string
- "responseStrategy": empty string`;

  return `${sectionContext}

Extract every requirement from the following RFP text. Return a JSON array where each element has:
- "rfpSection": the section reference (e.g., "L.4.3.2" or "M.2.1")
- "page": the page number (integer)
- "requirementText": the full requirement statement
- "obligationLevel": one of "shall", "must", "should", "may", "will", "is required to", "is expected to"
- "evalFactor": for Section M only, the evaluation factor name (empty string for Section L)
${lSpecificFields}

RFP TEXT:
${chunkText}`;
}

/**
 * Shape of a single requirement as returned by the LLM.
 * This matches the JSON structure we ask the model to produce.
 */
export interface RawExtractedRequirement {
  rfpSection: string;
  page: number;
  requirementText: string;
  obligationLevel: string;
  evalFactor: string;
  evalFactorHint: string;
  responseStrategy: string;
}
