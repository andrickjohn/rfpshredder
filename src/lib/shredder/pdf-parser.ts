// src/lib/shredder/pdf-parser.ts
// Purpose: Parse PDF files into structured text with page numbers
// Dependencies: pdf-parse, ./types
// Test spec: qa/test-specs/core-product.md

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { ParseResult, ParsedPage } from './types';

/**
 * Parse a PDF buffer into structured text with page numbers.
 * Uses pdf-parse (Node.js) for text extraction.
 *
 * @param buffer - The raw PDF file buffer
 * @returns ParseResult with per-page text and full concatenated text
 * @throws Error if PDF is scanned (no extractable text), empty, or exceeds page limit
 */
export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  const data = await pdfParse(buffer, {
    // We lift the max limit slightly for superusers in API, but pdfParse requires a hard limit
    max: 3000 + 1,
  });

  // Check for empty PDF
  if (!data.numpages || data.numpages === 0) {
    throw new PdfParseError(
      'The PDF file contains no pages.',
      'PDF_EMPTY'
    );
  }

  // We removed the throw here. Page limits are now strictly enforced in `api/shred/route.ts` 
  // so that superusers can bypass the 300 page limit (up to 1000 pages).

  // Check for scanned PDF (no extractable text)
  const trimmedText = data.text.trim();
  if (!trimmedText || trimmedText.length < 50) {
    throw new PdfParseError(
      'This appears to be a scanned PDF with no extractable text. RFP Shredder requires digital (text-based) PDFs. Please use OCR to convert the document first.',
      'SCANNED_PDF'
    );
  }

  // Split text by page breaks and build per-page results.
  // pdf-parse separates pages with form feed characters (\f) or
  // we can use the raw text and split on page boundaries.
  const pages = splitTextIntoPages(data.text, data.numpages);

  // Build full text with page markers
  const fullText = pages
    .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
    .join('\n\n');

  return {
    pages,
    totalPages: data.numpages,
    fullText,
  };
}

/**
 * Split extracted PDF text into per-page segments.
 * pdf-parse doesn't provide clean page boundaries natively,
 * so we split on form-feed characters when present.
 */
function splitTextIntoPages(rawText: string, totalPages: number): ParsedPage[] {
  // pdf-parse inserts form-feed (\f) between pages in some PDFs
  const rawPages = rawText.split(/\f/);

  // If we got the expected number of page splits, use them directly
  if (rawPages.length >= totalPages) {
    return rawPages.slice(0, totalPages).map((text, i) => ({
      pageNumber: i + 1,
      text: text.trim(),
    }));
  }

  // Fallback: if no form-feeds, distribute text evenly across pages.
  // This is a rough heuristic — works for most digital RFPs.
  const lines = rawText.split('\n');
  const linesPerPage = Math.ceil(lines.length / totalPages);
  const pages: ParsedPage[] = [];

  for (let i = 0; i < totalPages; i++) {
    const start = i * linesPerPage;
    const end = Math.min(start + linesPerPage, lines.length);
    pages.push({
      pageNumber: i + 1,
      text: lines.slice(start, end).join('\n').trim(),
    });
  }

  return pages;
}

/** Custom error class for PDF parsing failures */
export class PdfParseError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'PdfParseError';
    this.code = code;
  }
}
