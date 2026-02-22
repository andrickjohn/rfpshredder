// qa/tests/unit/excel-generator.test.ts
// Purpose: Unit tests for Excel compliance matrix generation
// Test spec: qa/test-specs/core-product.md

import { describe, it, expect } from 'vitest';
import { generateExcel } from '@/lib/shredder/excel-generator';
import type { Requirement } from '@/lib/shredder/types';
import type { CrossReference } from '@/lib/shredder/crossref';
import ExcelJS from 'exceljs';

function makeReq(overrides: Partial<Requirement> = {}): Requirement {
  return {
    id: 'L-001',
    rfpSection: 'L.4.3.1',
    page: 45,
    requirementText: 'The contractor shall provide a technical approach.',
    obligationLevel: 'shall',
    evalFactorMapping: 'M.2.1 — Technical Approach',
    responseStrategy: '',
    complianceStatus: '',
    ...overrides,
  };
}

const SAMPLE_REQUIREMENTS: Requirement[] = [
  makeReq({ id: 'L-001', obligationLevel: 'shall', page: 45 }),
  makeReq({ id: 'L-002', rfpSection: 'L.4.3.2', page: 46, requirementText: 'The offeror must submit three copies.', obligationLevel: 'must' }),
  makeReq({ id: 'L-003', rfpSection: 'L.4.4', page: 48, requirementText: 'The contractor should consider using agile.', obligationLevel: 'should' }),
  makeReq({ id: 'L-004', rfpSection: 'L.5', page: 50, requirementText: 'The contractor may include appendices.', obligationLevel: 'may' }),
  makeReq({ id: 'M-001', rfpSection: 'M.2.1', page: 80, requirementText: 'Proposals will be evaluated on technical merit.', obligationLevel: 'will', evalFactorMapping: 'Technical Approach' }),
];

const SAMPLE_CROSSREFS: CrossReference[] = [
  { lReqId: 'L-001', lSection: 'L.4.3.1', lRequirementSummary: 'Provide technical approach', mSection: 'M.2.1', mEvalFactor: 'Technical Approach', confidence: 'high' },
];

const METADATA = { totalPages: 200, processingTimeMs: 15000 };

describe('generateExcel', () => {
  it('generates a valid .xlsx buffer', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, SAMPLE_CROSSREFS, METADATA);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Verify it's a valid ZIP/XLSX (starts with PK header)
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
  });

  it('creates Sheet 1: Compliance Matrix with correct columns', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, SAMPLE_CROSSREFS, METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix');
    expect(sheet).toBeDefined();

    // Check header row
    const headerRow = sheet!.getRow(1);
    expect(headerRow.getCell(1).value).toBe('Req ID');
    expect(headerRow.getCell(2).value).toBe('RFP Section');
    expect(headerRow.getCell(3).value).toBe('Page');
    expect(headerRow.getCell(4).value).toBe('Requirement Text');
    expect(headerRow.getCell(5).value).toBe('Obligation Level');
    expect(headerRow.getCell(6).value).toBe('Eval Factor Mapping');
    expect(headerRow.getCell(7).value).toBe('Response Strategy');
    expect(headerRow.getCell(8).value).toBe('Compliance Status');
  });

  it('includes all requirements as data rows', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, SAMPLE_CROSSREFS, METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix')!;

    // Row 1 = header, rows 2-6 = data
    expect(sheet.getRow(2).getCell(1).value).toBe('L-001');
    expect(sheet.getRow(3).getCell(1).value).toBe('L-002');
    expect(sheet.getRow(6).getCell(1).value).toBe('M-001');
  });

  it('formats obligation levels with capitalized first letter', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, [], METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix')!;
    expect(sheet.getRow(2).getCell(5).value).toBe('Shall');
    expect(sheet.getRow(3).getCell(5).value).toBe('Must');
    expect(sheet.getRow(4).getCell(5).value).toBe('Should');
    expect(sheet.getRow(5).getCell(5).value).toBe('May');
    expect(sheet.getRow(6).getCell(5).value).toBe('Will');
  });

  it('applies header styling (bold, colored background)', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, [], METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix')!;
    const headerCell = sheet.getRow(1).getCell(1);

    expect(headerCell.font?.bold).toBe(true);
    expect(headerCell.font?.color?.argb).toBe('FFFFFFFF');
  });

  it('creates Sheet 2: L-M Cross Reference when crossRefs exist', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, SAMPLE_CROSSREFS, METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('L-M Cross Reference');
    expect(sheet).toBeDefined();

    const headerRow = sheet!.getRow(1);
    expect(headerRow.getCell(1).value).toBe('L Req ID');
    expect(headerRow.getCell(4).value).toBe('M Section');

    // Data row
    expect(sheet!.getRow(2).getCell(1).value).toBe('L-001');
    expect(sheet!.getRow(2).getCell(4).value).toBe('M.2.1');
  });

  it('does NOT create Sheet 2 when no crossRefs', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, [], METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('L-M Cross Reference');
    expect(sheet).toBeUndefined();
  });

  it('includes metadata footer', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, [], METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix')!;

    // Footer is 2 rows below last data row: 1 header + 5 data + 2 gap = row 8
    const footerRow = sheet.getRow(SAMPLE_REQUIREMENTS.length + 3);
    const footerValue = String(footerRow.getCell(1).value || '');
    expect(footerValue).toContain('Generated by RFP Shredder');
    expect(footerValue).toContain('200 pages');
    expect(footerValue).toContain('5 requirements');
  });

  it('includes AI disclaimer', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, [], METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix')!;
    const disclaimerRow = sheet.getRow(SAMPLE_REQUIREMENTS.length + 4);
    const disclaimerValue = String(disclaimerRow.getCell(1).value || '');
    expect(disclaimerValue).toContain('AI-generated');
    expect(disclaimerValue).toContain('verify against the original RFP');
  });

  it('handles empty requirements array', async () => {
    const buffer = await generateExcel([], [], METADATA);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Compliance Matrix');
    expect(sheet).toBeDefined();
  });

  it('sets compliance status dropdown validation', async () => {
    const buffer = await generateExcel(SAMPLE_REQUIREMENTS, [], METADATA);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('Compliance Matrix')!;
    const cell = sheet.getRow(2).getCell(8);
    expect(cell.dataValidation).toBeDefined();
    expect(cell.dataValidation?.type).toBe('list');
  });
});
