// src/lib/shredder/file-validator.ts
// Purpose: Validate uploaded files — MIME type, magic bytes, size, extension
// Dependencies: ./types
// Test spec: qa/test-specs/core-product.md

import {
  FileValidationResult,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_MIME_TYPES,
} from './types';

// Magic bytes for file type detection
// PDF: starts with %PDF (hex: 25 50 44 46)
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
// DOCX: ZIP archive starting with PK (hex: 50 4B 03 04)
const DOCX_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

/**
 * Detect file type from magic bytes in the buffer.
 * Returns 'pdf', 'docx', or null if unrecognized.
 */
export function detectFileType(buffer: Buffer | Uint8Array): 'pdf' | 'docx' | null {
  if (buffer.length < 4) return null;

  const header = buffer.slice(0, 4);

  // Check PDF magic bytes
  if (
    header[0] === PDF_MAGIC[0] &&
    header[1] === PDF_MAGIC[1] &&
    header[2] === PDF_MAGIC[2] &&
    header[3] === PDF_MAGIC[3]
  ) {
    return 'pdf';
  }

  // Check DOCX magic bytes (ZIP/PK header)
  if (
    header[0] === DOCX_MAGIC[0] &&
    header[1] === DOCX_MAGIC[1] &&
    header[2] === DOCX_MAGIC[2] &&
    header[3] === DOCX_MAGIC[3]
  ) {
    return 'docx';
  }

  return null;
}

/**
 * Validate an uploaded file for the shredder pipeline.
 * Checks: extension, MIME type, magic bytes, and file size.
 */
export function validateFile(
  buffer: Buffer | Uint8Array,
  fileName: string,
  mimeType: string
): FileValidationResult {
  // 1. Check file size
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File exceeds the 50MB limit. Your file is ${(buffer.length / (1024 * 1024)).toFixed(1)}MB.`,
      },
    };
  }

  // 2. Check file size is not zero
  if (buffer.length === 0) {
    return {
      valid: false,
      error: {
        code: 'FILE_EMPTY',
        message: 'The uploaded file is empty.',
      },
    };
  }

  // 3. Check extension
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension !== 'pdf' && extension !== 'docx') {
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `Only PDF and DOCX files are supported. You uploaded a .${extension} file.`,
      },
    };
  }

  // 4. Check MIME type
  const isSupportedMime = (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
  if (!isSupportedMime) {
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: 'The file MIME type is not supported. Only PDF and DOCX files are accepted.',
      },
    };
  }

  // 5. Check magic bytes — the real defense against renamed files
  const detectedType = detectFileType(buffer);
  if (!detectedType) {
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: 'The file content does not match a supported file type. Only genuine PDF and DOCX files are accepted.',
      },
    };
  }

  // 6. Cross-check: detected type must match claimed extension
  if (
    (extension === 'pdf' && detectedType !== 'pdf') ||
    (extension === 'docx' && detectedType !== 'docx')
  ) {
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: 'The file content does not match its extension. The file may have been renamed.',
      },
    };
  }

  return { valid: true, fileType: detectedType };
}
