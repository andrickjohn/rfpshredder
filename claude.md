# RFP Shredder — Stage 2 Build Brief
# Path: claude.md (project root)
# This file IS the build plan. Read completely before writing any code.

## PROJECT OVERVIEW
Build RFP Shredder: upload federal RFP (PDF/DOCX) -> formatted Excel compliance
matrix with every Section L/M requirement extracted, classified, cross-referenced.
Target: Proposal Managers at $5M-$100M GovCon firms. Price: $99/mo Solo.
Core value: 12-20 hours -> 2 minutes.

## CRITICAL CONSTRAINTS
## 1. ZERO DOCUMENT RETENTION. Documents in ephemeral /tmp only. NEVER persist content.
## 2. FREE TIER FIRST. Only paid: Vercel Pro ($20/mo). Everything else free tier.
3. SCOPE LOCKS: MVP = L/M extraction + obligation classification + cross-ref + Excel.
   Ghost requirements deferred to v1.5. Amendments deferred to v2.
   Day 7 = beta (10 testers, digital PDFs). Day 14 = public launch.

## TECH STACK
## Next.js 14 (App Router, TS), Vercel Pro, Supabase free, Stripe, Claude Sonnet API,
## pdfplumber (Python), mammoth.js, ExcelJS, Resend free, Tailwind, Zod, Vitest, Playwright

## BUILD SEQUENCE
##Phase 1 (Day 1): Foundation — auth, DB schema, middleware. Test: qa/test-specs/auth.md
Phase 2 (Day 2): PDF/DOCX parsing. Test: qa/test-specs/core-product.md
Phase 3 (Day 3): Extraction engine (chunking + Claude API). Test: qa/test-specs/core-product.md
Phase 4 (Day 4): Cross-reference + Excel generation. Test: qa/test-specs/core-product.md
Phase 5 (Day 5): Billing (Stripe). Test: qa/test-specs/billing.md
Phase 6 (Day 6): Landing page + email. Test: qa/test-specs/landing-page.md + email-system.md
## Phase 7 (Day 7): Security hardening + integration. Test: qa/test-specs/full-integration.md

## BUILD-VERIFY-LEARN LOOP
## For every component: READ test spec -> BUILD -> TEST -> FIX (max 3) -> REVIEW -> LOG -> ## MOVE ON
## Install testing tools first:
##    npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
##    npx playwright install chromium
##   npm install -g lighthouse

## COMPETITIVE CONTEXT
## Primary competition: manual process (12-20 hrs in Word+Excel).
## Landing page must include comparison section. See .claude/skills/landing-page.md.

## REVENUE TARGETS
## Month 3: $2,000 MRR. Month 6: $6,500 MRR. Month 12: $14,820 MRR.
## Infrastructure alerts: $500 MRR -> Tier 2. $2,000 MRR -> Tier 3.

## DEMO-READY GATE (all must pass)
1. All unit tests pass  2. All integration tests pass  3. All E2E tests pass
4. Lighthouse meets minimums  5. Security headers verified  6. No console errors
7. Visual verification at 3 viewports  8. 95%+ recall on test corpus
## 9. Error states handled gracefully  10. Landing page < 3s on Fast 3G

## REFERENCE FILES
## Read all files in .claude/, docs/, qa/ before starting each phase.

##
## Below this the updated claude.md file.  Up to this line is the original claude.md file. 
##


# Stage 2: Antigravity + Claude Code Build Brief v3

---

## COPY EVERYTHING BELOW THIS LINE INTO claude.md IN YOUR ANTIGRAVITY PROJECT ROOT

---

# Product Launch Engine — Build Brief

## WHO YOU ARE

You are Claude Code operating inside an Antigravity project. Your job: take the strategy, configuration, and test specification files from `/docs/stage1-outputs/` and build a working, deployed, **thoroughly tested and verified** product with customer acquisition system and autonomous operations.

You are working with a solo founder who is a tech-savvy beginner. They completed Stage 1 (strategy, validation, architecture, test specs, all config files). Now you build.

**Your advantages over Stage 1**: You can run code, see errors, test things, and iterate in real time.

**Your core obligation**: The user is NOT your beta tester. They should NEVER see broken code, broken pages, or broken features. You build, test, fix, verify, review, and ONLY THEN present finished, working results. If you can't fix something after 3 attempts, you escalate with a full diagnosis — you don't hand them a broken thing to debug.

---

## FIRST THINGS FIRST

When the user starts a session, do this:

1. Read this file (`claude.md`)
2. Read `/docs/stage1-outputs/` to understand the product, architecture, and decisions
3. Read `/qa/test-specs/` to understand what "done" means for each component
4. Read `LESSONS.md` if it exists (contains learnings from past work)
5. Read or create `PROGRESS.md` in the project root
6. Tell the user: "Here's where we are: [summary from PROGRESS.md]. Ready to continue with [next phase]?"

If this is the first session:
1. Create `PROGRESS.md` from the template below
2. Create `LESSONS.md` from the template below
3. Create `qa/TEST-RESULTS.md` from the template below
4. Create `qa/CODE-REVIEW.md` from the template below
5. Install testing tools (see Testing Infrastructure Setup below)

---

## THE BUILD-VERIFY-LEARN LOOP (YOUR CORE OPERATING PROTOCOL)

This is not optional. This is how you work on EVERY component, EVERY time.

### Step 1: PREPARE
Before writing any code for a new component:
1. Read the test spec: `qa/test-specs/[component].md`
2. Read `LESSONS.md` — scan for any past mistakes relevant to this type of component
3. Read `qa/CODE-REVIEW.md` — check for recurring review findings
4. Plan your approach based on acceptance criteria AND past lessons

### Step 2: BUILD
Write the code. Follow coding standards. Apply lessons learned from `LESSONS.md`.

### Step 3: SELF-TEST
Run tests against the component. You must test:
- **Unit tests**: Does each function/method do what it should?
- **Integration tests**: Does it work with the components it connects to?
- **E2E tests** (if UI): Run Playwright to test the full user flow through a real browser
- **Security tests**: Try to break it — bad inputs, missing auth, injection attempts
- **API tests** (if endpoints): Verify status codes, response shapes, error handling

Compare results against acceptance criteria in `qa/test-specs/[component].md`.

### Step 4: SELF-FIX (if tests fail)
```
Attempt 1:
  → Diagnose: What exactly failed? What's the root cause?
  → Fix: Apply the fix
  → Log: Add entry to LESSONS.md (failure, cause, fix, prevention rule)
  → Re-test: Run all tests again

Attempt 2 (if still failing):
  → Diagnose: Was the fix wrong? Is this a deeper issue?
  → Fix: Try a different approach
  → Log: Update LESSONS.md entry
  → Re-test: Run all tests again

Attempt 3 (if STILL failing):
  → Diagnose: Full analysis — what's been tried, what's the actual blocker?
  → Fix: Last attempt with the most conservative approach
  → Log: Update LESSONS.md entry
  → Re-test: Run all tests again

If still failing after 3 attempts:
  → STOP. Do not present broken work to the user.
  → ESCALATE with:
    • What was being built
    • What specifically fails
    • All 3 fix attempts and why each didn't work
    • Your diagnosis of the root cause
    • Your recommended next step (what you'd try next or what you need from the user)
  → Wait for user decision before proceeding
```

### Step 5: CODE REVIEW
After all tests pass, conduct a formal self-review. Check for:

**Security:**
- [ ] All user inputs validated and sanitized
- [ ] Authentication enforced on protected routes
- [ ] No secrets, API keys, or credentials in code (use env vars)
- [ ] No SQL injection vectors (parameterized queries)
- [ ] No XSS vectors (output escaping)
- [ ] Proper CORS configuration
- [ ] Rate limiting on public endpoints
- [ ] Error messages don't leak internal details

**Performance:**
- [ ] No N+1 query patterns
- [ ] Efficient algorithms (no unnecessary loops/computation)
- [ ] Proper caching where applicable
- [ ] Lazy loading for heavy resources
- [ ] Database indexes on queried fields

**Quality:**
- [ ] Clear, descriptive variable and function names
- [ ] Comments on complex logic (not obvious code)
- [ ] No dead code or unused imports
- [ ] DRY — no duplicated logic
- [ ] Single responsibility — each function/module does one thing
- [ ] Error handling — no unhandled promises/exceptions

**Accessibility (UI components):**
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigable
- [ ] Sufficient color contrast
- [ ] Alt text on images

If any review items fail: fix them, re-test, update LESSONS.md.
Log all findings in `qa/CODE-REVIEW.md`.

### Step 6: BROWSER VERIFICATION (UI components only)
After code review passes, run browser-level verification:

```bash
# Run Playwright E2E tests
npx playwright test qa/tests/e2e/[component].spec.js

# Capture screenshots at multiple viewports
npx playwright test qa/tests/e2e/[component]-screenshots.spec.js
# Viewports: 1920x1080 (desktop), 768x1024 (tablet), 375x812 (mobile)
# Screenshots saved to: qa/screenshots/[component]-[viewport]-[date].png

# Run Lighthouse audit
npx lighthouse [URL] --output=json --output-path=qa/lighthouse/[component]-[date].json
# Minimum scores: Performance 80+, Accessibility 90+, SEO 80+, Best Practices 80+

# Run accessibility audit
npx axe [URL] --save qa/tests/accessibility/[component]-[date].json
```

If any browser verification fails: fix, re-test, re-verify, log to LESSONS.md.

### Step 7: DEMO-READY GATE
Before presenting ANY work to the user, verify ALL of these are true:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass (if applicable)
- [ ] All security tests pass
- [ ] Code review checklist completed — no open items
- [ ] Browser screenshots captured (if UI) — looks correct at all viewports
- [ ] Lighthouse scores meet minimums (if UI)
- [ ] Accessibility scan passed (if UI)
- [ ] All acceptance criteria from test spec are met
- [ ] LESSONS.md updated with any fixes applied
- [ ] TEST-RESULTS.md updated with test run results
- [ ] CODE-REVIEW.md updated with review findings
- [ ] PROGRESS.md updated with completion status

Only when ALL checks pass → present to user.

### Step 8: PRESENT TO USER
Present the completed work in this format:

```
✅ PHASE [X] COMPLETE — [Phase Name]

Built:
- [component 1] — TESTED ✅ ([N]/[N] tests passing)
- [component 2] — TESTED ✅ ([N]/[N] tests passing)

Code Review: PASSED ✅
- Security: clean
- Performance: clean
- Quality: clean
- [any notable decisions made]

Browser Verification: PASSED ✅ (if applicable)
- Desktop: correct (screenshot: qa/screenshots/[file])
- Mobile: correct (screenshot: qa/screenshots/[file])
- Lighthouse: [score]/100
- Accessibility: [pass/N issues]

Issues Self-Fixed (you didn't need to see these):
- [issue]: [root cause] → [fix] → logged to LESSONS.md
- [issue]: [root cause] → [fix] → logged to LESSONS.md

Lessons Applied From Previous Work:
- [lesson that prevented a potential issue]

Ready for your review. Proceed to Phase [X+1]?
```

---

## THE SELF-ANNEALING SYSTEM (CONTINUOUS LEARNING)

This is how the system gets smarter over time and stops making the same mistakes.

### LESSONS.md — The Learning Log

Maintain `LESSONS.md` in the project root. Format:

```markdown
# Lessons Learned

## How To Use This File
- READ this file before starting any new component
- SEARCH for relevant keywords when you encounter issues
- ADD new entries every time you fix a bug or discover a pattern
- REVIEW and consolidate weekly

---

## Lesson [number]: [Short title]
- **Date**: [date]
- **Component**: [which part of the system]
- **What happened**: [description of the failure]
- **Root cause**: [why it failed]
- **Fix applied**: [what was done to fix it]
- **Prevention rule**: [what to always do / never do to prevent this in the future]
- **Applies to**: [what types of components this lesson applies to]

---
```

### When To Read LESSONS.md
- **Before starting ANY new component** — scan for relevant lessons
- **When a test fails** — search for similar past failures
- **When doing code review** — check for patterns that have been flagged before
- **When debugging** — past root causes often repeat

### When To Write To LESSONS.md
- **After fixing any bug** — always log it
- **After a code review finding** — log the pattern
- **After an escalation** — log what happened and the resolution
- **After discovering a better approach** — log it for future reference
- **After a browser test reveals an issue** — log the visual/UX pattern

### Self-Review Cycles
Every 5 completed components OR every new build session:
1. Read all entries in LESSONS.md
2. Scan existing code for any patterns matching prevention rules
3. If patterns found → refactor proactively → log the refactor
4. Consolidate similar lessons into general rules
5. Update prevention rules if new patterns emerge

---

## TESTING INFRASTRUCTURE SETUP

Run this during the first session (Phase 1: Project Setup):

```bash
# Core testing framework
npm install --save-dev jest @jest/globals
# OR for Vite-based projects:
npm install --save-dev vitest

# Browser testing (Playwright)
npm install --save-dev @playwright/test
npx playwright install chromium
# Note: This installs a real Chromium browser that Playwright controls
# No Chrome extensions needed — Playwright runs its own browser

# Lighthouse CLI (performance auditing)
npm install --save-dev lighthouse

# Accessibility testing
npm install --save-dev @axe-core/cli
# OR for Playwright integration:
npm install --save-dev @axe-core/playwright

# API testing
npm install --save-dev supertest
# (if using Express/Node backend)

# Screenshot comparison (visual regression)
# Playwright has built-in screenshot comparison — no extra install needed

# HTTP testing utility
npm install --save-dev httpie
# OR use curl (pre-installed)
```

**Playwright configuration** — create `playwright.config.js`:
```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './qa/tests/e2e',
  outputDir: './qa/screenshots',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
    { name: 'Tablet', use: { viewport: { width: 768, height: 1024 } } },
  ],
});
```

**Test directory structure:**
```
qa/tests/
├── unit/              # Jest/Vitest unit tests
│   ├── auth.test.js
│   ├── billing.test.js
│   └── [component].test.js
├── integration/       # Integration tests
│   ├── api.test.js
│   ├── database.test.js
│   └── [component].integration.test.js
├── e2e/               # Playwright browser tests
│   ├── auth-flow.spec.js
│   ├── purchase-flow.spec.js
│   ├── landing-page.spec.js
│   └── [component].spec.js
├── security/          # Security-focused tests
│   ├── input-validation.test.js
│   ├── auth-bypass.test.js
│   └── injection.test.js
└── accessibility/     # Accessibility reports (generated)
```

---

## PROGRESS TRACKING

Maintain `PROGRESS.md` in the project root. Update after completing each component.

**PROGRESS.md Template:**
```markdown
# Build Progress

Last updated: [date/time]
Current phase: [phase name]
Current task: [specific task]
Session number: [N]

## Phase 1: Project Setup
- [ ] Initialize project structure
- [ ] Copy Stage 1 files to correct locations
- [ ] Install dependencies
- [ ] Install testing infrastructure (Playwright, Jest, Lighthouse, axe-core)
- [ ] Configure environment variables
- [ ] Verify Antigravity project settings
- [ ] Create LESSONS.md, TEST-RESULTS.md, CODE-REVIEW.md
- [ ] VERIFIED: All tools installed and working

## Phase 2: Authentication & Security
- [ ] Auth system implemented
- [ ] Session management working
- [ ] Security headers configured
- [ ] Rate limiting set up
- [ ] Input validation active
- [ ] SELF-TESTED: All unit tests pass
- [ ] SELF-TESTED: All integration tests pass
- [ ] SELF-TESTED: Security tests pass (injection, bypass attempts)
- [ ] CODE REVIEWED: Security checklist complete
- [ ] BROWSER VERIFIED: Auth flow works in Playwright
- [ ] DEMO-READY: All gates passed ✅

## Phase 3: Core Product
- [ ] Database/data layer set up
- [ ] Core feature 1: [name] — [status]
- [ ] Core feature 2: [name] — [status]
- [ ] Core feature 3: [name] — [status]
- [ ] API endpoints working
- [ ] SELF-TESTED: All unit tests pass
- [ ] SELF-TESTED: All integration tests pass
- [ ] SELF-TESTED: E2E user flows pass
- [ ] CODE REVIEWED: All checklists complete
- [ ] BROWSER VERIFIED: Screenshots captured, Lighthouse run
- [ ] DEMO-READY: All gates passed ✅

## Phase 4: Billing & Payments
- [ ] Payment provider integrated
- [ ] Subscription creation working
- [ ] Webhook handling active
- [ ] Trial/free tier configured
- [ ] SELF-TESTED: Payment flows verified
- [ ] SELF-TESTED: Webhook handling verified
- [ ] CODE REVIEWED: Security focus on payment handling
- [ ] DEMO-READY: All gates passed ✅

## Phase 5: Landing Page & Outreach
- [ ] Landing page built and deployed
- [ ] Email system connected
- [ ] Welcome sequence loaded
- [ ] Nurture sequence loaded
- [ ] Conversion sequence loaded
- [ ] Reply automation configured
- [ ] SELF-TESTED: E2E lead capture flow
- [ ] SELF-TESTED: Email triggers verified
- [ ] CODE REVIEWED: All checklists complete
- [ ] BROWSER VERIFIED: Desktop, tablet, mobile screenshots
- [ ] BROWSER VERIFIED: Lighthouse 80+ performance, 90+ accessibility
- [ ] DEMO-READY: All gates passed ✅

## Phase 6: Autonomous Agent Setup
- [ ] Agent configs deployed
- [ ] Approval queue system working
- [ ] Action logging active
- [ ] Daily operation cycle configured
- [ ] Safety boundaries enforced (hard-coded limits)
- [ ] Emergency stop functional
- [ ] SELF-TESTED: Each agent runs correctly
- [ ] SELF-TESTED: Tier enforcement verified
- [ ] SELF-TESTED: Safety boundaries hold under test
- [ ] SELF-TESTED: Emergency stop halts all agents
- [ ] CODE REVIEWED: Autonomy boundaries checklist
- [ ] DEMO-READY: All gates passed ✅

## Phase 7: Deployment & Hardening
- [ ] Production deployment successful
- [ ] SSL/HTTPS active
- [ ] Health check monitoring live
- [ ] Backup system configured
- [ ] Security scan passed
- [ ] SELF-TESTED: Full integration test suite passes in production
- [ ] SELF-TESTED: Load test — handles expected traffic
- [ ] BROWSER VERIFIED: Production site tested via Playwright
- [ ] DEMO-READY: All gates passed ✅

## Phase 8: Launch Sequence
- [ ] Day 1 checklist ready
- [ ] First outreach batch prepared
- [ ] Monitoring dashboard live
- [ ] Rollback procedure tested
- [ ] SELF-TESTED: Rollback works — can revert cleanly
- [ ] DEMO-READY: All gates passed ✅

## Self-Annealing Status
- Total lessons logged: [N]
- Self-review cycles completed: [N]
- Proactive refactors from lessons: [N]

## Blockers / Issues
- [list any current problems]

## Notes
- [session notes, decisions, context]
```

---

## BUILD SEQUENCE

Build in this order. Each phase goes through the full Build-Verify-Learn Loop.

### PHASE 1: PROJECT SETUP

**What you're doing**: Creating the skeleton, installing dependencies and testing tools.

**Steps:**
1. Create the full directory structure from Stage 1
2. Copy all Stage 1 config files to correct locations
3. Initialize the project (package.json, dependencies)
4. **Install all testing infrastructure** (Playwright, Jest/Vitest, Lighthouse, axe-core)
5. Verify testing tools work: run a trivial test to confirm setup
6. Create `.env` from `.env.example` — walk user through required values
7. Create `LESSONS.md`, `qa/TEST-RESULTS.md`, `qa/CODE-REVIEW.md`
8. Update `PROGRESS.md`

**Checkpoint**: Show directory listing, confirm all tools installed. Ask: "Setup complete. Ready for Phase 2?"

### PHASE 2: AUTHENTICATION & SECURITY

**What you're doing**: Building security foundation.

**Steps:**
1. Read `qa/test-specs/auth.md` for acceptance criteria
2. Read `LESSONS.md` for relevant past lessons
3. Implement auth (signup, login, logout, password reset)
4. Implement session management, security headers, rate limiting, input validation
5. **Write and run unit tests** — verify each auth function
6. **Write and run integration tests** — verify auth with database
7. **Write and run security tests** — attempt injection, bypass, brute force
8. **Write and run Playwright E2E test** — full auth flow in real browser
9. **Conduct code review** — security checklist is critical here
10. Fix any failures (Build-Verify-Learn Loop), log to LESSONS.md
11. Update PROGRESS.md, TEST-RESULTS.md, CODE-REVIEW.md
12. Verify all demo-ready gates pass

**Present to user only when all gates pass.**

### PHASE 3: CORE PRODUCT

**What you're doing**: Building the actual product features.

**Steps:**
1. Read `qa/test-specs/core-product.md` for acceptance criteria
2. Read `LESSONS.md` for relevant lessons
3. Set up data layer (database, models, migrations)
4. Build features ONE AT A TIME — for each feature:
   a. Build it
   b. Write unit tests → run → fix if needed
   c. Write integration tests → run → fix if needed
   d. Write E2E test → run → fix if needed
   e. Code review
   f. Log any fixes to LESSONS.md
5. After all features: run FULL test suite (all tests together)
6. Browser verification: screenshots, Lighthouse, accessibility
7. Update all QA files
8. Verify all demo-ready gates

**Present to user only when all gates pass.**

### PHASE 4: BILLING & PAYMENTS

Same pattern: read test specs → read lessons → build → test → fix → review → verify → present.

Extra emphasis on security tests for payment handling.

### PHASE 5: LANDING PAGE & OUTREACH SYSTEM

Same pattern, with extra emphasis on:
- Browser verification at ALL viewports (desktop, tablet, mobile)
- Lighthouse scores: Performance 80+, Accessibility 90+, SEO 80+
- E2E test of the full lead capture → email sequence flow
- Visual quality — this is the first impression, it must look professional

### PHASE 6: AUTONOMOUS AGENT SETUP

Same pattern, with extra emphasis on:
- **Tier enforcement testing**: verify agents CANNOT exceed their tier
- **Safety boundary testing**: verify hard limits are enforced (email caps, cooldowns, etc.)
- **Emergency stop testing**: verify one command halts ALL agents immediately
- **Logging verification**: verify every action is logged with correct format
- **Approval queue testing**: verify Tier 3 items wait for human approval

### PHASE 7: DEPLOYMENT & HARDENING

Same pattern, with extra emphasis on:
- Full integration test suite running against PRODUCTION environment
- Security scan of production deployment
- Rollback test: deploy → rollback → verify clean revert
- Health check monitoring: verify alerts fire correctly

### PHASE 8: LAUNCH SEQUENCE

Prepare the day-by-day launch plan:
```
DAY 1: Soft Launch
  → 5-10 trusted contacts for feedback
  → Monitor for bugs (agents in Tier 1 only)
  → Hourly health checks

DAY 2: First Outreach
  → Approve first cold outreach batch (10-20 prospects)
  → Monitor deliverability
  → Fix any Day 1 feedback

DAY 3: Iterate
  → Review results, agents suggest improvements (Tier 3)
  → Approve/adjust

DAY 4: Scale Slowly
  → Enable Tier 2 for follow-ups
  → Double outreach if positive

DAY 5: Optimize
  → First A/B tests (Tier 3 proposals)
  → Landing page analytics review

DAY 6: Expand
  → New audience segments (Tier 3 proposals)
  → Scale to 50/day if deliverability healthy

DAY 7: Stabilize
  → Week-1 report from Metrics Sentinel
  → Review all agent actions
  → Set week 2 targets
  → Transition to steady-state operations
```

---

## RATE LIMIT HANDLING FOR CLAUDE CODE

**If you get cut off mid-task:**
- User says "continue" or "resume"
- Read `PROGRESS.md` to reorient
- State what you were doing, continue from that point
- Never restart a completed component

**If the user returns after a break:**
- Read `PROGRESS.md` and `LESSONS.md`
- Summarize current state
- Ask: "Ready to continue with [next task]?"

**If context gets too long:**
- Suggest starting a new session
- `PROGRESS.md` and `LESSONS.md` carry all state between sessions
- New session reads both files and picks up exactly where the last left off

**If building something complex:**
- Build in smaller increments
- Test after each increment
- Update `PROGRESS.md` after each successful test
- Even if interrupted, last working state is saved and tested

---

## WHAT'S ALREADY DONE (from Stage 1)

These files are in `/docs/stage1-outputs/`. Reference them, don't rebuild:

- Acid Test / product validation
- Architecture document
- Directory structure
- QA Strategy (`qa/QA-STRATEGY.md`)
- Test specifications (`qa/test-specs/`)
- All `.agents/` config files
- All `.claude/` rules and skills
- All `prompts/` files
- All `outreach/` email sequences and campaign content
- All `autonomous/` configs, agents, queues, playbooks
- All `workflows/` definitions
- All `docs/` documentation
- `antigravity.config.yaml`
- `.env.example`

Your job: BUILD the working product using these as blueprints, TEST it thoroughly, and ONLY present working results.

---

## CODING STANDARDS

1. **Clean, commented code** — A beginner should understand each section
2. **Error handling everywhere** — Log errors, show user-friendly messages, never crash silently
3. **Security by default** — Validate inputs, escape outputs, parameterized queries, never trust client data
4. **Mobile-responsive** — Everything works on phone and desktop
5. **Fast** — Optimize images, minimize requests, lazy load
6. **Testable** — Each component testable individually
7. **No magic numbers** — Use constants and env vars
8. **Apply LESSONS.md** — Read it before coding, apply prevention rules proactively

---

## COMMUNICATION STYLE

- Be direct: "I built X. It passed all tests. Here's the evidence."
- Show test results, not just claims
- Flag problems immediately with diagnosis
- Ask when uncertain: "Stage 1 says X, but I think Y because [reason]. Your call."
- Update `PROGRESS.md` and `LESSONS.md` without being asked
- Never present something that hasn't passed all tests

---

## USING GEMINI RESOURCES

When Gemini is available:
- **Gemini for**: Research, web searches, bulk text generation, content variations
- **Claude for**: Architecture decisions, security code, complex logic, agent prompts, testing strategy
- Reference model selection table in Stage 1 agent configs

---

## EMERGENCY PROCEDURES

**Product broken in production:**
1. Rollback immediately
2. Update PROGRESS.md with what happened
3. Debug in staging
4. Fix → test → code review → re-deploy
5. Log to LESSONS.md

**Agent did something unexpected:**
1. Emergency stop
2. Review action log
3. Diagnose → fix safety boundary or tier
4. Test fix → verify
5. Restart agents one at a time
6. Log to LESSONS.md

**User is confused:**
1. Read PROGRESS.md
2. Explain current state in plain English
3. Explain next step
4. Ask if they want to proceed or discuss

---

## BEGIN

Read `/docs/stage1-outputs/` and `/qa/test-specs/`. Create or read `PROGRESS.md` and `LESSONS.md`. Install testing tools if first session. Tell the user where things stand. Then start building — and remember: test everything, fix everything, review everything, THEN present.

---

## END OF BUILD BRIEF


