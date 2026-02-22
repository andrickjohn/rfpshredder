# Test Corpus — Instructions
# Path: qa/test-corpus/README.md
# Purpose: How to build and maintain the accuracy test corpus

## What Is the Test Corpus?

A collection of real, publicly available federal RFPs with human-verified
"ground truth" compliance matrices. This is what we test the shredder
against to measure extraction accuracy.

## How to Build the Initial Corpus (During Beta, Days 7-14)

### Step 1: Find 5+ Public RFPs
Go to SAM.gov and download RFPs that are publicly posted, 50-250 pages,
include clear Sections L and M, and come from different agencies.

### Step 2: Create Ground Truth Matrices
For each RFP, manually create the "correct" compliance matrix with every
requirement, section reference, page number, obligation level, and L-to-M mapping.
Save as: test-corpus/{rfp-name}-ground-truth.xlsx

### Step 3: Store the RFPs
- test-corpus/{agency}-{type}-{year}.pdf
- test-corpus/{agency}-{type}-{year}-ground-truth.xlsx

### Running Accuracy Tests
The accuracy test harness (built in Stage 2) shreds each test corpus RFP,
compares to ground truth, and reports: recall, precision, obligation accuracy,
cross-reference accuracy.

### Maintaining the Corpus
Add new RFPs when: customer reports missed requirements, new RFP format
encountered, or new features launched.
Target: 10+ RFPs by Month 3, 20+ by Month 6.
