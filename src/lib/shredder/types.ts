// src/lib/shredder/types.ts
// Purpose: Shared types for the RFP shredder pipeline
// Dependencies: none
// Test spec: qa/test-specs/core-product.md

/** A single page of extracted text with its page number */
export interface ParsedPage {
  pageNumber: number;
  text: string;
}

/** Result from PDF or DOCX parsing */
export interface ParseResult {
  pages: ParsedPage[];
  totalPages: number;
  /** Full text concatenated with page markers */
  fullText: string;
}

/** Obligation levels per GovCon terminology */
export type ObligationLevel =
  | 'shall'
  | 'must'
  | 'should'
  | 'may'
  | 'will'
  | 'is required to'
  | 'is expected to';

/** A detected section from the RFP */
export interface DetectedSection {
  type: 'L' | 'M' | 'other';
  title: string;
  /** Section reference like "L.4.3.2" */
  reference: string;
  startPage: number;
  endPage: number;
  text: string;
}

/** Result from section detection */
export interface SectionDetectionResult {
  sectionL: DetectedSection | null;
  sectionM: DetectedSection | null;
  otherSections: DetectedSection[];
  warnings: string[];
}

/** A chunk of text ready for Claude API extraction */
export interface TextChunk {
  index: number;
  text: string;
  startPage: number;
  endPage: number;
  tokenEstimate: number;
}

/** A single extracted requirement */
export interface Requirement {
  id: string;
  rfpSection: string;
  page: number;
  requirementText: string;
  obligationLevel: ObligationLevel;
  evalFactorMapping: string;
  responseStrategy: string;
  complianceStatus: string;
}

/** File validation result */
export interface FileValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
  fileType?: 'pdf' | 'docx';
}

/** Supported MIME types */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/** Constraints */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_PAGE_COUNT = 300;
export const MAX_TOKENS_PER_CHUNK = 100_000;
export const CHUNK_OVERLAP_TOKENS = 50;

/** Approximate token count — 1 token ≈ 4 characters for English text */
export const CHARS_PER_TOKEN = 4;
