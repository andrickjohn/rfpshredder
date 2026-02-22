// qa/tests/unit/dashboard.test.ts
// Purpose: Verify dashboard components export correctly and upload validation works
// Test spec: qa/test-specs/full-integration.md

import { describe, it, expect } from 'vitest';
import { validateUploadFile } from '@/components/dashboard/upload-form';

describe('dashboard components', () => {
  it('exports UploadForm component', async () => {
    const mod = await import('@/components/dashboard/upload-form');
    expect(mod.UploadForm).toBeDefined();
    expect(typeof mod.UploadForm).toBe('function');
  });

  it('exports ShredHistory component', async () => {
    const mod = await import('@/components/dashboard/shred-history');
    expect(mod.ShredHistory).toBeDefined();
    expect(typeof mod.ShredHistory).toBe('function');
  });

  it('exports SubscriptionStatus component', async () => {
    const mod = await import('@/components/dashboard/subscription-status');
    expect(mod.SubscriptionStatus).toBeDefined();
    expect(typeof mod.SubscriptionStatus).toBe('function');
  });
});

describe('validateUploadFile', () => {
  it('accepts valid PDF file', () => {
    expect(validateUploadFile({ name: 'test.pdf', size: 1024 })).toBeNull();
  });

  it('accepts valid DOCX file', () => {
    expect(validateUploadFile({ name: 'document.docx', size: 1024 })).toBeNull();
  });

  it('rejects .exe file', () => {
    const error = validateUploadFile({ name: 'malware.exe', size: 1024 });
    expect(error).toContain('Unsupported file type');
    expect(error).toContain('.exe');
  });

  it('rejects .txt file', () => {
    const error = validateUploadFile({ name: 'notes.txt', size: 1024 });
    expect(error).toContain('Unsupported file type');
  });

  it('rejects file over 50MB', () => {
    const error = validateUploadFile({ name: 'huge.pdf', size: 60 * 1024 * 1024 });
    expect(error).toContain('File too large');
    expect(error).toContain('50MB');
  });

  it('rejects empty file', () => {
    const error = validateUploadFile({ name: 'empty.pdf', size: 0 });
    expect(error).toContain('empty');
  });

  it('accepts file just under 50MB', () => {
    expect(validateUploadFile({ name: 'big.pdf', size: 49 * 1024 * 1024 })).toBeNull();
  });

  it('rejects file at exactly 50MB + 1 byte', () => {
    const error = validateUploadFile({ name: 'exact.pdf', size: 50 * 1024 * 1024 + 1 });
    expect(error).toContain('File too large');
  });

  it('handles case-insensitive extensions', () => {
    expect(validateUploadFile({ name: 'TEST.PDF', size: 1024 })).toBeNull();
    expect(validateUploadFile({ name: 'doc.DOCX', size: 1024 })).toBeNull();
  });
});
