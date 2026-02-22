// qa/tests/unit/file-validator.test.ts
// Purpose: Unit tests for file validation (MIME, magic bytes, size, extension)
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { validateFile, detectFileType } from '@/lib/shredder/file-validator';
import { MAX_FILE_SIZE_BYTES } from '@/lib/shredder/types';

// Minimal valid PDF header
const PDF_HEADER = Buffer.from('%PDF-1.4 minimal test content');
// Minimal valid DOCX/ZIP header (PK\x03\x04)
const DOCX_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
// An EXE header (MZ)
const EXE_HEADER = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

describe('detectFileType', () => {
  it('detects PDF from magic bytes', () => {
    expect(detectFileType(PDF_HEADER)).toBe('pdf');
  });

  it('detects DOCX from magic bytes (ZIP/PK header)', () => {
    expect(detectFileType(DOCX_HEADER)).toBe('docx');
  });

  it('returns null for unrecognized magic bytes', () => {
    expect(detectFileType(EXE_HEADER)).toBeNull();
    expect(detectFileType(Buffer.from('hello'))).toBeNull();
  });

  it('returns null for empty/short buffer', () => {
    expect(detectFileType(Buffer.from([]))).toBeNull();
    expect(detectFileType(Buffer.from([0x50]))).toBeNull();
  });
});

describe('validateFile', () => {
  it('accepts a valid PDF', () => {
    const result = validateFile(
      PDF_HEADER,
      'test-rfp.pdf',
      'application/pdf'
    );
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('pdf');
  });

  it('accepts a valid DOCX', () => {
    const result = validateFile(
      DOCX_HEADER,
      'test-rfp.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('docx');
  });

  it('rejects file exceeding 50MB', () => {
    // Don't allocate 50MB — just test the check using a mock size
    const bigBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1);
    // Set PDF magic bytes so only size fails
    bigBuffer[0] = 0x25;
    bigBuffer[1] = 0x50;
    bigBuffer[2] = 0x44;
    bigBuffer[3] = 0x46;
    const result = validateFile(bigBuffer, 'big.pdf', 'application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('FILE_TOO_LARGE');
  });

  it('rejects empty file', () => {
    const result = validateFile(Buffer.from([]), 'empty.pdf', 'application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('FILE_EMPTY');
  });

  it('rejects unsupported extension', () => {
    const result = validateFile(
      EXE_HEADER,
      'malware.exe',
      'application/x-msdownload'
    );
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('rejects EXE renamed to .pdf (magic bytes mismatch)', () => {
    const result = validateFile(
      EXE_HEADER,
      'evil.pdf',
      'application/pdf'
    );
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('rejects file with wrong MIME type', () => {
    const result = validateFile(
      PDF_HEADER,
      'test.pdf',
      'text/plain'
    );
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('rejects PDF content with DOCX extension', () => {
    const result = validateFile(
      PDF_HEADER,
      'sneaky.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('UNSUPPORTED_FILE_TYPE');
  });
});
