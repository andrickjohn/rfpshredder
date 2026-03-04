// src/lib/shredder/docx-parser.ts
// Purpose: Parse DOCX files into structured text using mammoth.js
// Dependencies: mammoth, ./types
// Test spec: qa/test-specs/core-product.md

import mammoth from 'mammoth';
import { ParseResult, ParsedPage } from './types';

/**
 * Parse a DOCX buffer into structured text.
 *
 * DOCX files don't have inherent page numbers (pagination depends on rendering),
 * so we use section breaks and heading patterns to create logical "pages."
 * Each heading-delimited section becomes a logical page.
 *
 * @param buffer - The raw DOCX file buffer
 * @returns ParseResult with logical sections as pages and full concatenated text
 * @throws Error if DOCX is empty or unparseable
 */
export async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });

  const rawText = result.value.trim();

  // Check for empty document
  if (!rawText || rawText.length < 10) {
    throw new DocxParseError(
      'The DOCX file contains no extractable text.',
      'DOCX_EMPTY'
    );
  }

  // Split into logical sections using heading patterns and section breaks.
  // DOCX doesn't provide real page numbers, so we use structural markers.
  const pages = splitDocxIntoSections(rawText);

  // We removed the throw here. Limit enforcement is strictly in api/shred/route.ts
  // Build full text with section markers
  const fullText = pages
    .map((p) => `[SECTION ${p.pageNumber}]\n${p.text}`)
    .join('\n\n');

  // Log warnings if mammoth reported any
  if (result.messages.length > 0) {
    // Warnings are informational only — don't fail
    const warningCount = result.messages.filter(
      (m) => m.type === 'warning'
    ).length;
    if (warningCount > 0) {
      // Swallow warnings silently — they're usually about unsupported features
    }
  }

  return {
    pages,
    totalPages: pages.length,
    fullText,
  };
}

/**
 * Split DOCX extracted text into logical sections.
 * Uses patterns like "Section X", "SECTION X", "Part X", numbered headings,
 * and large blank gaps to detect section boundaries.
 */
function splitDocxIntoSections(rawText: string): ParsedPage[] {
  // Split on common section/heading patterns in RFPs
  const sectionPattern =
    /\n(?=(?:SECTION|Section|PART|Part)\s+[A-Z0-9])|(?:\n{3,})/g;

  const segments = rawText.split(sectionPattern).filter((s) => s.trim().length > 0);

  // If no clear sections found, split into ~2000-char chunks as logical pages
  if (segments.length <= 1) {
    return splitBySize(rawText, 2000);
  }

  return segments.map((text, i) => ({
    pageNumber: i + 1,
    text: text.trim(),
  }));
}

/**
 * Fallback: split text into chunks of approximately `charsPerPage` characters,
 * breaking at paragraph boundaries.
 */
function splitBySize(text: string, charsPerPage: number): ParsedPage[] {
  const paragraphs = text.split(/\n\n+/);
  const pages: ParsedPage[] = [];
  let currentText = '';
  let pageNum = 1;

  for (const para of paragraphs) {
    if (currentText.length + para.length > charsPerPage && currentText.length > 0) {
      pages.push({ pageNumber: pageNum, text: currentText.trim() });
      pageNum++;
      currentText = para;
    } else {
      currentText += (currentText ? '\n\n' : '') + para;
    }
  }

  if (currentText.trim()) {
    pages.push({ pageNumber: pageNum, text: currentText.trim() });
  }

  return pages;
}

/** Custom error class for DOCX parsing failures */
export class DocxParseError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'DocxParseError';
    this.code = code;
  }
}
