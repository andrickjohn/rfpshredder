# RFP Shredder — Code Review Log

## Phase 1: Foundation — 2026-02-21

### Security
- [x] All user inputs validated with Zod (auth schemas)
- [x] No secrets in code — all via env vars
- [x] No SQL injection vectors — Supabase parameterized queries
- [x] XSS prevention — name field regex rejects HTML/script tags
- [x] Security headers set in middleware (HSTS, X-Frame-Options, etc.)
- [x] Rate limiting implemented for login (5/15min) and signup (3/hr)
- [x] JWT validation via Supabase Auth middleware
- [x] Service role client isolated to admin.ts with clear warnings
- [x] Generic error messages — no information leakage

### Performance
- [x] No N+1 patterns (no complex queries yet)
- [x] Minimal dependencies installed
- [x] Rate limit cleanup on interval with unref()

### Quality
- [x] File headers with path, purpose, dependencies, test spec
- [x] Named exports throughout
- [x] TypeScript strict mode
- [x] Clean separation: browser client / server client / admin client / middleware helper
- [x] Zod schemas export both validators and inferred types

### Findings
- None requiring action.

---

## Phase 2: PDF/DOCX Parsing — 2026-02-22

### Security
- [x] File validation: triple-layer (extension + MIME + magic bytes)
- [x] Renamed files detected and rejected (EXE-as-PDF blocked)
- [x] 50MB size limit enforced before any parsing
- [x] Empty file guard — 0-byte files rejected
- [x] Python serverless: /tmp cleaned in finally block (zero retention)
- [x] No document content stored anywhere persistent
- [x] Custom error classes — no stack traces or internal details exposed
- [x] Page count limit (300) enforced

### Performance
- [x] Token estimation: O(1) character-length heuristic, no tokenizer overhead
- [x] Chunking splits at page boundaries — avoids mid-sentence breaks
- [x] Single-pass section detection (regex scan)
- [x] Overlap only adds 50 tokens per chunk boundary — minimal overhead

### Quality
- [x] File headers on all files
- [x] Named exports, custom error classes
- [x] Types exported for downstream use
- [x] Constants centralized in types.ts (MAX_FILE_SIZE_BYTES, MAX_PAGE_COUNT, etc.)
- [x] Section detector handles multiple naming conventions (Section, Part, Volume)
- [x] DOCX parser gracefully handles missing page numbers with logical section splitting
- [x] Chunker handles edge cases (empty pages, single page, exact-fit)

### Findings
- Section detector uses regex-based detection. Will need tuning if real RFPs use very non-standard formatting. Acceptable for MVP digital PDFs.
- DOCX page numbers are approximations (logical sections, not print pages). This is inherent to the format — mammoth.js doesn't provide real page breaks.

---

## Phase 3: Extraction Engine — 2026-02-22

### Security
- [x] API key from env var only — never hardcoded
- [x] No document content logged or stored — only structured requirements in transit
- [x] Error messages from API failures don't expose document content
- [x] Extraction prompt explicitly instructs "no preamble" — reduces risk of prompt injection in output

### Performance
- [x] Sequential chunk processing — safer for rate limits than parallel
- [x] max_tokens capped at 8192 — prevents runaway responses
- [x] Deduplication uses word-level Jaccard similarity — O(n²) but n is small (typical: <100 requirements)
- [x] Stop words excluded from similarity comparison — reduces noise

### Quality
- [x] File headers on all 4 new files
- [x] Named exports, custom error classes
- [x] Obligation classifier: 7 levels with explicit precedence ordering
- [x] Response parser: handles clean JSON, markdown fences, partial JSON salvage
- [x] Deduplicator: keeps longer version (more context), renumbers IDs after merge
- [x] Extraction prompt: GovCon-specific terminology, explicit JSON schema

### Findings
- Extractor processes chunks sequentially. Could parallelize for speed, but sequential is safer for API rate limits at MVP scale. Revisit at scale.
- Deduplication threshold (0.85) may need tuning on real RFP corpus. Conservative for now.
- Default obligation for unclassified text is "shall" (conservative). This matches federal contracting convention where ambiguity implies mandatory.

---

## Phase 4: Cross-Reference + Excel Generation — 2026-02-22

### Security
- [x] /api/shred: auth check before any processing
- [x] Rate limiting enforced (10/user/hr)
- [x] Subscription/trial check before processing
- [x] Zero retention: fileBuffer and parseResult set to null after use
- [x] Zero retention: finally block ensures cleanup even on error
- [x] Error responses: no document content leaked in error messages
- [x] Failed shred logged with metadata only (no content)
- [x] Excel streamed with Cache-Control: no-store

### Performance
- [x] File buffer released immediately after parsing (before extraction)
- [x] Excel generated in-memory via ExcelJS writeBuffer
- [x] Cross-ref: O(L*M) matching — acceptable for typical RFP sizes (<100 L, <50 M)

### Quality
- [x] Excel format matches output-standards.md exactly: 8 columns, obligation colors, frozen header, auto-filter, dropdown validation
- [x] Sheet 2 L-M Cross Reference only created when cross-refs exist
- [x] Metadata footer with date, page count, requirement count
- [x] AI disclaimer in every generated file
- [x] Cross-ref engine: 3 matching strategies with confidence levels
- [x] Pipeline route: 13-step orchestration with clear error handling at each step
- [x] Trial usage incremented atomically after successful shred

### Findings
- pdf-parse requires `require()` instead of ESM import in Next.js (Lesson 4). Vitest works fine with either — always verify in `next dev` too.
- Cross-ref keyword matching includes GovCon stop words (offeror, contractor, government, proposal) to reduce noise.

---

## Phase 5: Billing (Stripe) — 2026-02-22

### Security
- [x] Webhook signature verified on every request via stripe.webhooks.constructEvent
- [x] Invalid/missing signature returns 401 — no processing occurs
- [x] Admin (service role) client used only in webhook handler — never in user-facing routes
- [x] Checkout and portal routes: auth check before any Stripe API call
- [x] Rate limiting on all billing endpoints (20/user/min)
- [x] Price set server-side via STRIPE_PRICE_SOLO_MONTHLY env var — client cannot manipulate
- [x] No secrets in code — STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET from env vars
- [x] Generic error messages — no Stripe internals leaked to client
- [x] User can only access own billing portal (auth-scoped Stripe customer ID)

### Performance
- [x] Business logic in pure functions (canShred) — no unnecessary async/DB calls
- [x] Webhook idempotency: in-memory Set with automatic eviction at 1000 entries
- [x] Checkout creates Stripe customer only when needed (not on every call)

### Quality
- [x] File headers on all 5 new files
- [x] Named exports throughout
- [x] Business logic separated from route handlers (subscription.ts vs route files)
- [x] Injectable dependencies in business functions — Stripe client and Supabase client passed as parameters for testability
- [x] All 4 webhook event types handled with correct profile updates
- [x] canShred covers all subscription states: trial, active, canceled, past_due
- [x] Routes follow API route pattern: auth → rate limit → authorize → execute → respond → error handle

### Findings
- Webhook idempotency uses in-memory Set (not database). Acceptable for MVP on Vercel — catches rapid-fire duplicates within a function instance. Upgrade to database-backed idempotency at scale.
- Stripe API version defaults to SDK-bundled version. Pin explicitly if webhook payload format changes become an issue.

---

## Phase 6: Landing Page + Email — 2026-02-22

### Security
- [x] No secrets or API keys in landing page components (all server-side)
- [x] Email templates use inline styles — no external CSS/JS injection vectors
- [x] Unsubscribe link in every email template
- [x] No PII beyond email address in email logs
- [x] Email sending never blocks user-facing operations (fire-and-forget pattern)
- [x] CTA buttons link to /signup and /dashboard — no external redirects
- [x] Footer legal links present (Privacy Policy, Terms of Service, Security)

### Performance
- [x] Landing page is mostly Server Components — minimal client JS
- [x] Only FAQ section is a Client Component (for accordion interactivity)
- [x] No external images or heavy assets — pure Tailwind CSS
- [x] Email templates are plain HTML with inline styles — no images
- [x] sendEmailAsync fires without awaiting — user flow never blocked

### Quality
- [x] File headers on all 12 new files
- [x] Named exports throughout
- [x] Landing page split into 9 focused components (under 200 lines each)
- [x] All 10 sections from landing-page.md spec present
- [x] Design follows brand: Navy #1B365D, Green #10B981, Inter font
- [x] Pricing section: Free Trial, Solo ($99/mo highlighted), Enterprise
- [x] Comparison table: 6 metrics (time, cost, accuracy, cross-ref, obligation, output)
- [x] FAQ: 6 questions covering product, accuracy, security, trial, cancellation, scanned PDFs
- [x] Email templates: consistent structure with layout helper, CTA button helper
- [x] Email subjects ≤50 chars per email-automation.md spec
- [x] 6 email types cover full lifecycle: welcome → trial → nudge → subscribe → cancel → payment fail

### Accessibility
- [x] Semantic HTML: nav, main, section, footer elements
- [x] Heading hierarchy: h1 in hero, h2 in each section, h3 for sub-items
- [x] FAQ buttons have aria-expanded attribute
- [x] SVG icons have currentColor fill (inherits text color)
- [x] Sufficient color contrast: white on navy, navy on white

### Findings
- trial_nudge email requires a cron job or scheduled function (24hr after trial) — not yet wired. Template exists, trigger deferred to post-launch.
- Testimonials are placeholders — should be replaced with real quotes from beta testers.
- Legal pages (Privacy Policy, Terms of Service, Security) are placeholder spans — need real content before public launch.

---

## Phase 7: Security Hardening + Integration — 2026-02-22

### Security
- [x] Content-Security-Policy header added with full directive set
- [x] CSP allows Stripe JS (checkout), Supabase (auth/data), blocks everything else
- [x] CSP blocks object embeds (object-src 'none'), restricts base-uri and form-action to 'self'
- [x] All 7 security headers verified in actual HTTP response (curl -I)
- [x] Security headers extracted to shared module for testability
- [x] Upload form client-side validation: file type, size, empty file checks
- [x] Dashboard auth check: middleware redirects unauthenticated to /login
- [x] Shred history shows metadata only — never document content

### Performance
- [x] Dashboard uses Server Components for data fetching (profile, shred history)
- [x] Only interactive components (UploadForm, SubscriptionStatus) are Client Components
- [x] Upload form validates client-side before making API call (saves bandwidth)
- [x] Shred history limited to 10 most recent entries

### Quality
- [x] File headers on all 6 new files
- [x] Named exports throughout
- [x] Dashboard has 3 clear sections: subscription status, upload form, shred history
- [x] Upload form: drag-and-drop + click-to-browse, clear progress states, error recovery without refresh
- [x] Subscription status adapts to all 4 states: trial, active, canceled, past_due
- [x] Error messages are specific and actionable (file type, size, connection errors)
- [x] validateUploadFile exported separately for testability

### Accessibility
- [x] Upload drop zone has role="button" and aria-label
- [x] File input has aria-label
- [x] Error messages wrapped in role="alert"
- [x] Success messages wrapped in role="status"
- [x] SVG icons have aria-hidden="true"

### Findings
- CSP uses 'unsafe-inline' and 'unsafe-eval' for Next.js compatibility. This is a known Next.js limitation — nonce-based CSP would be more secure but requires custom server configuration. Acceptable for MVP.
- Dashboard currently has no real-time progress updates during shred processing. The processing indicator shows but doesn't stream progress from the server. WebSocket or SSE streaming could be added post-MVP.
- Shred history doesn't have pagination — limited to last 10 entries. Add pagination when users accumulate more history.
