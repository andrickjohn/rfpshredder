// src/lib/shredder/excel-generator.ts
// Purpose: Generate formatted Excel compliance matrix per output-standards.md
// Dependencies: exceljs, ./types, ./crossref
// Test spec: qa/test-specs/core-product.md

import ExcelJS from 'exceljs';
import type { Requirement, ObligationLevel } from './types';
import type { CrossReference } from './crossref';

/** Column definitions per output-standards.md */
const MATRIX_COLUMNS: Array<{
  header: string;
  key: keyof Requirement;
  width: number;
}> = [
  { header: 'Req ID', key: 'id', width: 10 },
  { header: 'RFP Section', key: 'rfpSection', width: 14 },
  { header: 'Page', key: 'page', width: 8 },
  { header: 'Requirement Text', key: 'requirementText', width: 60 },
  { header: 'Obligation Level', key: 'obligationLevel', width: 18 },
  { header: 'Eval Factor Mapping', key: 'evalFactorMapping', width: 30 },
  { header: 'Response Strategy', key: 'responseStrategy', width: 30 },
  { header: 'Compliance Status', key: 'complianceStatus', width: 18 },
];

/** Header style: bold, #1B365D background, white text */
const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1B365D' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const HEADER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  vertical: 'middle',
  horizontal: 'center',
  wrapText: true,
};

/** Obligation level colors per output-standards.md */
const OBLIGATION_COLORS: Record<string, string> = {
  'shall': 'FFFFE0E0',       // red
  'must': 'FFFFE0E0',        // red
  'is required to': 'FFFFE0E0', // red
  'should': 'FFFFF3CD',      // yellow
  'is expected to': 'FFFFF3CD', // yellow
  'may': 'FFD4EDDA',         // green
  'will': 'FFFFF3CD',        // yellow (mid-strength obligation)
};

/** Alternating row colors */
const ROW_EVEN_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8F9FA' },
};

/** Compliance status dropdown values */
const COMPLIANCE_OPTIONS = '"Compliant,Partial,Non-Compliant,N/A"';

/**
 * Generate a formatted Excel compliance matrix.
 *
 * @param requirements - Extracted and cross-referenced requirements
 * @param crossRefs - L-to-M cross-reference mappings (for Sheet 2)
 * @param metadata - Document metadata for the footer
 * @returns Buffer containing the .xlsx file
 */
export async function generateExcel(
  requirements: Requirement[],
  crossRefs: CrossReference[],
  metadata: { totalPages: number; processingTimeMs: number }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RFP Shredder';
  workbook.created = new Date();

  // Sheet 1: Compliance Matrix
  buildComplianceMatrix(workbook, requirements, metadata);

  // Sheet 2: L-M Cross Reference (if applicable)
  if (crossRefs.length > 0) {
    buildCrossRefSheet(workbook, crossRefs);
  }

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Build Sheet 1: Compliance Matrix
 */
function buildComplianceMatrix(
  workbook: ExcelJS.Workbook,
  requirements: Requirement[],
  metadata: { totalPages: number; processingTimeMs: number }
): void {
  const sheet = workbook.addWorksheet('Compliance Matrix');

  // Set column widths
  sheet.columns = MATRIX_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = thinBorder();
  });
  headerRow.height = 30;

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Add auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: MATRIX_COLUMNS.length },
  };

  // Add data rows
  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const row = sheet.addRow({
      id: req.id,
      rfpSection: req.rfpSection,
      page: req.page,
      requirementText: req.requirementText,
      obligationLevel: formatObligationLabel(req.obligationLevel),
      evalFactorMapping: req.evalFactorMapping,
      responseStrategy: req.responseStrategy,
      complianceStatus: req.complianceStatus,
    });

    // Alternating row fill
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = ROW_EVEN_FILL;
      });
    }

    // Obligation level color on column 5
    const obligationCell = row.getCell(5);
    const colorKey = req.obligationLevel.toLowerCase();
    if (OBLIGATION_COLORS[colorKey]) {
      obligationCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: OBLIGATION_COLORS[colorKey] },
      };
    }

    // Wrap text on requirement column
    row.getCell(4).alignment = { wrapText: true, vertical: 'top' };

    // Compliance status dropdown
    row.getCell(8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [COMPLIANCE_OPTIONS],
    };

    // Borders on all cells
    row.eachCell((cell) => {
      cell.border = thinBorder();
    });
  }

  // Metadata footer row (2 rows below data)
  const footerRowNum = requirements.length + 3;
  const today = new Date().toISOString().split('T')[0];
  const footerCell = sheet.getCell(`A${footerRowNum}`);
  footerCell.value = `Generated by RFP Shredder | ${today} | ${metadata.totalPages} pages | ${requirements.length} requirements`;
  footerCell.font = { size: 9, italic: true, color: { argb: 'FF888888' } };
  sheet.mergeCells(`A${footerRowNum}:H${footerRowNum}`);

  // Disclaimer row
  const disclaimerRowNum = footerRowNum + 1;
  const disclaimerCell = sheet.getCell(`A${disclaimerRowNum}`);
  disclaimerCell.value = 'AI-generated. Always verify against the original RFP.';
  disclaimerCell.font = { size: 9, italic: true, color: { argb: 'FFAA0000' } };
  sheet.mergeCells(`A${disclaimerRowNum}:H${disclaimerRowNum}`);
}

/**
 * Build Sheet 2: L-M Cross Reference
 */
function buildCrossRefSheet(
  workbook: ExcelJS.Workbook,
  crossRefs: CrossReference[]
): void {
  const sheet = workbook.addWorksheet('L-M Cross Reference');

  sheet.columns = [
    { header: 'L Req ID', key: 'lReqId', width: 10 },
    { header: 'L Section', key: 'lSection', width: 14 },
    { header: 'L Requirement Summary', key: 'lRequirementSummary', width: 50 },
    { header: 'M Section', key: 'mSection', width: 14 },
    { header: 'M Eval Factor', key: 'mEvalFactor', width: 40 },
    { header: 'Confidence', key: 'confidence', width: 12 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = thinBorder();
  });
  headerRow.height = 30;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Add data
  for (let i = 0; i < crossRefs.length; i++) {
    const ref = crossRefs[i];
    const row = sheet.addRow(ref);

    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = ROW_EVEN_FILL;
      });
    }

    // Confidence color coding
    const confidenceCell = row.getCell(6);
    if (ref.confidence === 'high') {
      confidenceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    } else if (ref.confidence === 'medium') {
      confidenceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    } else {
      confidenceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
    }

    row.eachCell((cell) => {
      cell.border = thinBorder();
    });
  }
}

/** Format obligation level for display: capitalize first letter */
function formatObligationLabel(level: ObligationLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** Standard thin border for all cells */
function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD0D0D0' } };
  return { top: side, left: side, bottom: side, right: side };
}
