# RFP Shredder — QA Strategy
# Path: qa/QA-STRATEGY.md
# Purpose: Master quality assurance document for Stage 2 development
# Created: Stage 1 Strategy Session

## Testing Philosophy

Nothing reaches the user until it passes all tests. Every component has a
test specification (qa/test-specs/) that defines what "working" means.
Claude Code reads the spec before building, tests against it after building,
and does not move on until all criteria pass.

## Testing Layers

### 1. Unit Tests (Vitest)
- Individual functions, utilities, data transformations
- Target: 80% code coverage overall, 100% on security-critical code
- Run: on every file save during development
- Location: qa/tests/unit/

### 2. Integration Tests (Vitest + Supabase)
- Components working together: API routes, database operations, auth flows
- Test with real Supabase instance (test project or local)
- Location: qa/tests/integration/

### 3. End-to-End Tests (Playwright)
- Full user flows through a real browser
- Critical journeys: signup, trial shred, subscribe, paid shred, cancel
- Run against: local dev server or preview deployment
- Location: qa/tests/e2e/

### 4. Visual Verification (Playwright Screenshots)
- Screenshot comparison at three viewports:
  - Desktop: 1920x1080
  - Tablet: 768x1024
  - Mobile: 375x812
- Stored in: qa/screenshots/
- Review: manual comparison (no automated pixel-diff at launch scale)

### 5. Performance Audit (Lighthouse CLI)
- Minimum scores: Performance 80+, Accessibility 90+, SEO 80+, Best Practices 80+
- Run: after every landing page change
- Stored in: qa/lighthouse/
- Command: lighthouse http://localhost:3000 --output=json --output-path=qa/lighthouse/latest.json

### 6. Security Tests
- Input validation: malformed files, oversized files, wrong MIME types
- Auth bypass: accessing protected routes without JWT, with expired JWT
- Injection: SQL injection attempts, XSS payloads in input fields
- Header verification: all security headers present and correct
- Location: qa/tests/security/

### 7. API Contract Tests
- Every API endpoint returns correct status codes for all scenarios
- Response shapes match TypeScript types
- Error responses use standard error format
- Location: qa/tests/integration/ (alongside integration tests)

### 8. Accuracy Tests (CRITICAL — Product Quality)
- Compare extraction output against human-verified ground truth matrices
- Targets: 95%+ recall, 90%+ precision, 95%+ obligation accuracy, 85%+ cross-reference accuracy
- Test corpus: 5+ real publicly posted RFPs with manually created ground truth
- Location: qa/test-corpus/
- Run: after any change to extraction prompt, chunking logic, or parsing

## Build-Verify-Learn Loop

```
BUILD component
  |
  v
VERIFY (run all tests for this component)
  |
  +--> PASS --> REVIEW (code review checklist) --> LOG (PROGRESS.md) --> NEXT
  |
  +--> FAIL --> DIAGNOSE --> FIX --> re-VERIFY (max 3 loops)
                                        |
                                        +--> Still failing after 3 --> ESCALATE
```

## Self-Correction Protocol

### Test Failure
1. Read the error message and stack trace
2. Identify root cause (not just symptom)
3. Apply fix
4. Re-run failing test
5. If pass: run full component test suite to check for regressions
6. Maximum 3 fix attempts. After 3: escalate to user with full diagnosis.

### Code Review Failure
1. Identify which checklist item failed
2. Fix the specific issue
3. Re-run the code review checklist
4. Maximum 2 fix attempts. After 2: escalate.

### Browser Test Failure
1. Take a screenshot of the failure state
2. Compare to expected state
3. Identify CSS/layout/logic issue
4. Fix and re-verify at all three viewports
5. Maximum 3 fix attempts. After 3: escalate with screenshots.

## Self-Annealing Protocol (Learning From Mistakes)

### LESSONS.md Format
```markdown
## [Date] — [Component] — [Brief Title]
**Failure**: [What went wrong — specific error or test failure]
**Root cause**: [Why it went wrong — the actual cause, not the symptom]
**Fix**: [What fixed it — specific code change or approach]
**Prevention**: [Rule to follow in future code to prevent recurrence]
```

### Protocol
1. Every fix is logged to LESSONS.md (no exceptions)
2. Before starting each new component: read LESSONS.md for relevant past mistakes
3. Every 5 components (or weekly): scan all existing code for past mistake patterns
4. If a pattern is found in existing code: refactor immediately
5. LESSONS.md is the institutional memory — it grows throughout development

## Code Review Protocol

Run this checklist before marking any component complete:

### Security Check
- [ ] Input validation on all external inputs (Zod schemas)
- [ ] Auth check on all protected routes
- [ ] No secrets in code (all in environment variables)
- [ ] No document content in logs or persistent storage
- [ ] No SQL injection (Supabase client only, no raw SQL)
- [ ] XSS prevention (React auto-escapes + CSP headers)
- [ ] Rate limiting on sensitive endpoints

### Performance Check
- [ ] No N+1 database queries
- [ ] Efficient algorithms (no unnecessary loops or re-processing)
- [ ] Proper caching where appropriate
- [ ] Lazy loading for below-fold content
- [ ] Images optimized (Next.js Image component)

### Quality Check
- [ ] Clear naming (functions, variables, types describe what they do)
- [ ] Comments on complex logic (why, not what)
- [ ] No dead code (unused imports, commented-out blocks)
- [ ] DRY (no duplicated logic — extract into shared utilities)
- [ ] TypeScript strict mode (no `any`, no implicit returns)
- [ ] Error handling on every async operation

### Accessibility Check
- [ ] Semantic HTML (headings, landmarks, lists)
- [ ] ARIA labels on interactive elements without visible text
- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible

### Maintainability Check
- [ ] Single responsibility (each function/component does one thing)
- [ ] Clear interfaces (typed inputs and outputs)
- [ ] Dependencies documented
- [ ] File size < 200 lines (split if larger)

## Demo-Ready Gate

ALL of these must be true before presenting to the user:

1. All unit tests pass
2. All integration tests pass
3. All E2E tests pass for 5 critical user journeys
4. Lighthouse scores: Performance 80+, Accessibility 90+, SEO 80+, BP 80+
5. Security headers verified (curl -I check)
6. No console errors in browser at any page
7. Visual verification passes at desktop, tablet, mobile
8. Extraction accuracy: 95%+ recall on test corpus
9. All error states handled gracefully with user-friendly messages
10. Landing page loads < 3 seconds on Fast 3G throttle

## Testing Tools — Installation

```bash
# Unit and integration testing
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Browser testing
npm install -D playwright @playwright/test
npx playwright install chromium

# Performance testing
npm install -g lighthouse

# Accessibility testing
npm install -D axe-core @axe-core/playwright
```
