# Test Specification: Core Product (Shredder Pipeline)
# Path: qa/test-specs/core-product.md
# THIS IS THE MOST CRITICAL TEST SPEC — the pipeline IS the product.

## Acceptance Criteria
- [ ] User can upload a PDF (up to 50MB, 300 pages)
- [ ] User can upload a DOCX (up to 50MB, 300 pages)
- [ ] Invalid file types are rejected with clear error message
- [ ] Oversized files are rejected with clear error message
- [ ] PDF text is extracted with page numbers and section markers
- [ ] DOCX text is extracted with section markers
- [ ] Section L and Section M are correctly identified
- [ ] Text is chunked into segments <= 100K tokens with 50-token overlap
- [ ] Requirements are extracted with obligation levels
- [ ] L-to-M cross-references are generated
- [ ] Excel compliance matrix is generated with correct formatting
- [ ] User can download the Excel file
- [ ] Processing completes within 120 seconds for a 200-page PDF
- [ ] No document content is stored in any persistent storage
- [ ] Shred metadata is logged (page count, req count, time, status)
- [ ] Accuracy: 95%+ recall on test corpus
- [ ] Accuracy: 90%+ precision on test corpus
- [ ] Accuracy: 95%+ obligation level accuracy
- [ ] Accuracy: 85%+ cross-reference accuracy

## Unit Tests Required
- Test: parsePDF(100-page-pdf) -> Expected: structured text with page numbers
- Test: parsePDF(scanned-pdf) -> Expected: graceful error "Scanned PDF not supported"
- Test: parseDOCX(standard-docx) -> Expected: structured text
- Test: detectSections(text-with-L-and-M) -> Expected: { sectionL: {...}, sectionM: {...} }
- Test: detectSections(text-without-sections) -> Expected: { error: "SECTIONS_NOT_FOUND" }
- Test: chunkText(50K-tokens) -> Expected: 1 chunk
- Test: chunkText(150K-tokens) -> Expected: 2 chunks with 50-token overlap
- Test: classifyObligation("The contractor shall provide...") -> Expected: "shall"
- Test: classifyObligation("The contractor should consider...") -> Expected: "should"
- Test: classifyObligation("The contractor may optionally...") -> Expected: "may"
- Test: generateExcel(requirements-array) -> Expected: valid .xlsx buffer
- Test: validateFileType(pdf-buffer) -> Expected: true
- Test: validateFileType(exe-renamed-to-pdf) -> Expected: false (magic bytes check)

## Integration Tests Required
- Test: POST /api/shred with valid PDF + auth -> Expected: 200, Excel download
- Test: POST /api/shred with valid DOCX + auth -> Expected: 200, Excel download
- Test: POST /api/shred with .exe renamed to .pdf -> Expected: 400, UNSUPPORTED_FILE_TYPE
- Test: POST /api/shred with 60MB file -> Expected: 400, FILE_TOO_LARGE
- Test: POST /api/shred without auth -> Expected: 401
- Test: POST /api/shred with trial user (0 shreds used) -> Expected: 200
- Test: POST /api/shred with trial user (1 shred used) -> Expected: 403, TRIAL_EXHAUSTED
- Test: POST /api/shred with active subscriber -> Expected: 200
- Test: Verify shred_log entry created with correct metadata after successful shred
- Test: Verify NO document content in shred_log, application logs, or database

## Accuracy Tests Required (Against Test Corpus)
- Test: Shred test-corpus/gsa-schedule-2026.pdf -> Compare to ground truth
  - Recall: count of matched requirements / total ground truth requirements >= 95%
  - Precision: count of correct extractions / total extracted >= 90%
  - Obligation accuracy: correct obligation level / total requirements >= 95%
  - Cross-reference accuracy: correct L-to-M mappings / total mappings >= 85%
- Repeat for each RFP in the test corpus (minimum 5)

## E2E / Browser Tests Required
- Flow: Login -> Click "Shred an RFP" -> Upload PDF -> Wait for processing -> Download Excel -> Verify file opens and has correct columns
- Flow: Upload invalid file -> See clear error message -> Can upload valid file after
- Flow: Trial user shreds first RFP -> Prompted to subscribe -> Cannot shred again without subscribing
- Viewport checks: upload interface usable on desktop, tablet, mobile
- Processing state: progress indicators visible during shredding

## Security Tests Required
- Test: Upload a file with embedded JavaScript -> Expected: no execution
- Test: Upload a zip bomb disguised as PDF -> Expected: rejected or timeout gracefully
- Test: Check that /tmp is clean after function completes (no leftover files)
- Test: Check application logs contain NO document content or requirement text
- Test: Check database contains NO document content (query shred_log for text fields)

## Edge Cases
- PDF with no Section L or M -> Expected: 422 SECTIONS_NOT_FOUND with helpful message
- PDF with Section L but no Section M -> Expected: matrix generated without cross-references, warning included
- PDF with non-standard section numbering (e.g., "Part L" instead of "Section L") -> Expected: best-effort detection
- PDF with tables containing requirements -> Expected: table text extracted correctly
- PDF with headers/footers on every page -> Expected: headers/footers not treated as requirements
- DOCX with tracked changes -> Expected: process final text, ignore tracked changes markup
- Empty PDF (0 pages) -> Expected: 400 error
- PDF with 301 pages -> Expected: 400 PAGE_LIMIT_EXCEEDED

## What "Done" Looks Like
A Proposal Manager uploads a 200-page DoD RFP. In under 2 minutes, they download a formatted Excel compliance matrix containing every Section L and M requirement, correctly classified by obligation level, with Section L requirements cross-referenced to Section M evaluation criteria. The matrix is professional enough to hand to their VP of BD without reformatting.
