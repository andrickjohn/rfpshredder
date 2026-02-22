#!/usr/bin/env bash
# ============================================================
# RFP Shredder — Stage 1 Setup Script
# ============================================================
# Purpose: Creates all Stage 1 files in the correct directories.
# Usage:   chmod +x stage1-setup.sh && ./stage1-setup.sh
# Run from: Project root (Antigravity workspace)
# ============================================================

set -euo pipefail

echo "============================================================"
echo " RFP Shredder — Stage 1 File Setup"
echo " Creating ~75 files across all project directories..."
echo "============================================================"
echo ""

# ============================================================
# STEP 1: CREATE DIRECTORY STRUCTURE
# ============================================================

echo "[1/4] Creating directory structure..."

mkdir -p .agents
mkdir -p .claude/rules
mkdir -p .claude/skills
mkdir -p docs/architecture
mkdir -p qa/test-specs
mkdir -p qa/test-corpus
mkdir -p qa/tests/unit
mkdir -p qa/tests/integration
mkdir -p qa/tests/e2e
mkdir -p qa/tests/security
mkdir -p qa/screenshots
mkdir -p qa/lighthouse
mkdir -p scripts
mkdir -p src/app
mkdir -p src/api
mkdir -p src/auth
mkdir -p src/billing
mkdir -p src/utils
mkdir -p api/parse-pdf
mkdir -p outreach/landing-page
mkdir -p outreach/email-sequences
mkdir -p outreach/cold-outreach
mkdir -p outreach/reply-templates
mkdir -p outreach/prospect-research
mkdir -p outreach/campaigns
mkdir -p autonomous/config
mkdir -p autonomous/agents
mkdir -p autonomous/queues
mkdir -p autonomous/playbooks
mkdir -p workflows
mkdir -p prompts/research
mkdir -p prompts/outreach
mkdir -p prompts/product
mkdir -p prompts/operations

echo "  ✓ All directories created"
echo ""

# ============================================================
# STEP 2: CREATE ALL STAGE 1 FILES
# ============================================================

echo "[2/4] Writing Stage 1 files..."

# ────────────────────────────────────────
# docs/COMPETITIVE-POSITIONING.md
# ────────────────────────────────────────
cat > docs/COMPETITIVE-POSITIONING.md << 'STAGE1EOF'
# RFP Shredder — Competitive Positioning Matrix
# Path: docs/COMPETITIVE-POSITIONING.md
# Purpose: Living document mapping all alternatives buyers use instead of this product
# Created: Stage 1 Strategy Session
# Update frequency: Monthly, or when competitive landscape changes
# Last updated: [DATE]

## How to Use This Document

This is your competitive intelligence reference. Use it to:
1. Write outreach emails that address what the prospect is CURRENTLY doing
2. Write landing page copy that speaks to the most common alternative
3. Prioritize features that beat the most common alternative (not the best competitor)
4. Train outreach agents on how to segment prospects by current alternative

## Competitive Positioning Matrix

| Alternative | Category | Cost to Buyer ($/mo) | Time Cost (hrs/week) | Key Capabilities | Where It Falls Short | Switching Trigger |
|---|---|---|---|---|---|---|
| Deltek GovWin/Costpoint | Direct | $4,167–$12,500/mo ($50K–$150K/yr) | 2–4 hrs/week admin | Full proposal lifecycle, historical pricing, pipeline mgmt | No automated compliance matrix generation — users still build matrices manually. Requires dedicated admin. | Contract renewal sticker shock, or realizing the compliance matrix step is still manual despite the price tag |
| Privia / Lohfeld Consulting | Direct | $2,500+/mo ($30K+/yr) | 2–3 hrs/week | Proposal process consulting + tools, win rate analytics | Compliance matrix is a manual step within their framework. Priced for large firms. | Firm outgrows the consulting model and wants to bring proposal ops in-house |
| PMAPS (Proposal Management) | Direct | $2,000+/mo ($25K+/yr) | 2–3 hrs/week | Proposal scheduling, color team management, volume tracking | No AI extraction. Matrix creation is a manual task. Designed for large firms (100+ employees). | Small firm realizes they're paying enterprise prices for features they don't use |
| ChatGPT / Claude (generic AI) | Indirect | $0–$20/mo | 3–6 hrs/week cleanup | Can extract text from pasted RFP content, answer questions about requirements | Cannot produce formatted Excel compliance matrix. No Section L-to-M cross-referencing. No obligation classification. Output requires 3–6 hours of manual cleanup and formatting. | User spends more time formatting AI output than it would take to do it manually |
| Reusable compliance matrix templates | Indirect | $0 | 4–8 hrs/bid customizing | Provides a starting structure for similar bids | Only works for nearly identical RFPs. Every new requirement must be manually added. Templates go stale. Miss unique requirements. | Firm starts bidding on diverse contract types where templates don't apply |
| Senior Proposal Manager (manual) | Manual | $4,500–$9,600/bid labor | 12–20 hrs/bid | Thorough, contextual understanding, catches nuance | Expensive (PM billing at $75–$120/hr), slow (12–20 hours), fatigue-dependent accuracy, doesn't scale across concurrent bids | Managing 3+ concurrent proposals — physically cannot spend 20 hours per matrix |
| Junior staff / intern assigned | Manual | $1,500–$2,400/bid labor | 15–25 hrs/bid | Cheap labor | High error rate, misses obligation level nuance (confuses "should" with "shall"), poor L-to-M cross-referencing, requires senior review adding more hours | Junior staff misses a mandatory requirement and the bid is disqualified |
| Proposal consultant (outsourced) | Manual | $2,250–$5,000/bid | 0 hrs (outsourced) | Expert-level work, fresh eyes | Expensive ($150–$250/hr), slow turnaround (3–5 business days), consultant needs context each time, hard to find during peak bid season | Consultant is unavailable during a critical bid, or costs exceed the bid margin |
| Doing nothing / accepting risk | Status Quo | $0 direct | 0 hrs | No effort required | Risk of disqualification from missed requirements. No compliance traceability for color reviews. Evaluators score compliance poorly. | Gets disqualified on a bid due to missed requirements, or loses a must-win contract to a competitor with better compliance |
| Ad-hoc combination (partial manual + AI) | Status Quo | $0–$20/mo | 8–15 hrs/bid | Flexible, uses available tools | Inconsistent quality, no standardized process, knowledge lives in one person's head, breaks when that person is unavailable | Key proposal person leaves the company or goes on vacation during a bid |

## Positioning Statement

Most small GovCon firms build compliance matrices manually — a senior Proposal Manager spending 12–20 hours per bid reading through hundreds of pages, copy-pasting "shall" statements into Excel, and cross-referencing Section L against Section M by hand. RFP Shredder replaces that entire process in under 2 minutes: upload the RFP, download a formatted compliance matrix with every requirement extracted, classified, and cross-referenced. The switching trigger is managing 3+ concurrent proposals — the moment the manual process becomes physically unsustainable.

## Competitive Advantage Summary

1. **Formatted Excel matrix in 2 minutes** instead of 12–20 hours of manual copy-paste work in Word and Excel
2. **Automatic L-to-M cross-referencing** instead of skipping this step because it takes too long manually (most teams skip it — we make it automatic)
3. **$99/month for unlimited bids** instead of $2,250–$5,000 per bid for a consultant or $4,500–$9,600 in PM labor per bid

## How to Update This Document

### Adding a New Alternative
1. Identify the alternative (from customer conversations, community monitoring, or competitive research)
2. Categorize: Direct / Indirect / Manual / Status Quo
3. Fill in all columns: Cost, Time, Capabilities, Shortcomings, Switching Trigger
4. Update outreach templates if the new alternative is common enough to warrant a segment

### Revising a Switching Trigger
1. Note which trigger changed and why (based on actual conversion data)
2. Update the matrix
3. Update outreach templates that reference the old trigger

### Revising Pricing
1. If a competitor changes pricing, update their row
2. Reassess: does our pricing still make sense relative to alternatives?
3. Note in the changelog below

## Changelog

| Date | Change | Reason |
|---|---|---|
| [Launch date] | Initial version created from Stage 1 Acid Test | — |
STAGE1EOF

echo "  ✓ docs/COMPETITIVE-POSITIONING.md"

# ────────────────────────────────────────
# docs/REVENUE-FORECAST.md
# ────────────────────────────────────────
cat > docs/REVENUE-FORECAST.md << 'STAGE1EOF'
# RFP Shredder — Revenue Forecast Model
# Path: docs/REVENUE-FORECAST.md
# Purpose: 12-month financial projection with assumptions and reconciliation instructions
# Created: Stage 1 Strategy Session
# Update frequency: Monthly (reconcile actuals), or when assumptions change
# Last updated: [DATE]

## Assumptions

| Assumption | Conservative | Baseline | Optimistic | Basis |
|---|---|---|---|---|
| Average selling price (monthly) | $99 | $130 | $165 | Solo $99 dominates; Baseline assumes 15% Team at $299; Optimistic adds Enterprise |
| Average customer lifetime (months) | 12 | 18 | 24 | SMB SaaS typical 12–24 months for sticky workflow tools |
| Monthly churn rate | 7% | 5% | 3% | SMB SaaS typical 3–7% |
| New customers/month (Month 1–3) | 4 | 8 | 14 | Conservative: founder-only outreach. Baseline: optimized outreach. Optimistic: early word-of-mouth |
| New customers/month (Month 4–6) | 7 | 12 | 20 | Baseline: agent-assisted + community traction |
| New customers/month (Month 7–12) | 10 | 15 | 25 | Baseline: content + partnerships + organic |
| Customer Acquisition Cost (CAC) | $225 | $175 | $125 | See CAC calculation below |
| Monthly infrastructure cost (launch) | $55 | $55 | $55 | Vercel Pro $20 + domain $1 + API ~$30 + buffer |
| Monthly infrastructure cost (Month 6) | $120 | $95 | $95 | Adds Supabase Pro, Sentry at $500 MRR |
| Monthly infrastructure cost (Month 12) | $250 | $180 | $180 | Adds monitoring, analytics at $2K MRR |

## CAC Calculation

For solo founders, CAC is primarily time:
- Founder hourly opportunity cost: $75/hr (adjusted from $50 default — GovCon domain expertise)
- Hours per acquired customer:
  - Research: 0.5 hrs (identify prospect on SAM.gov + LinkedIn)
  - Outreach: 0.3 hrs (personalize and send email/DM)
  - Follow-up: 0.5 hrs (2–3 follow-ups)
  - Demo/onboarding: 1.0 hrs (respond to questions, support trial)
  - Total: 2.3 hours per acquired customer
- CAC = 2.3 hrs × $75/hr = $172.50 ≈ $175

**Each customer costs approximately $175 to acquire, primarily in founder time (2.3 hours at $75/hr).**

CAC vs. revenue: $175 CAC / $130 ASP = 1.3 months to recover CAC. This is excellent.

## 12-Month Revenue Projection (BASELINE)

| Month | New Customers | Lost to Churn | Total Active | MRR | Cumulative Revenue | Monthly Costs | Monthly Net | Cumulative Net |
|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 0 | 6 | $780 | $780 | $55 | $725 | $725 |
| 2 | 8 | 0 | 14 | $1,820 | $2,600 | $55 | $1,765 | $2,490 |
| 3 | 8 | 1 | 21 | $2,730 | $5,330 | $95 | $2,635 | $5,125 |
| 4 | 10 | 1 | 30 | $3,900 | $9,230 | $95 | $3,805 | $8,930 |
| 5 | 12 | 2 | 40 | $5,200 | $14,430 | $95 | $5,105 | $14,035 |
| 6 | 12 | 2 | 50 | $6,500 | $20,930 | $120 | $6,380 | $20,415 |
| 7 | 14 | 3 | 61 | $7,930 | $28,860 | $120 | $7,810 | $28,225 |
| 8 | 14 | 3 | 72 | $9,360 | $38,220 | $120 | $9,240 | $37,465 |
| 9 | 15 | 4 | 83 | $10,790 | $49,010 | $150 | $10,640 | $48,105 |
| 10 | 15 | 4 | 94 | $12,220 | $61,230 | $150 | $12,070 | $60,175 |
| 11 | 15 | 5 | 104 | $13,520 | $74,750 | $180 | $13,340 | $73,515 |
| 12 | 15 | 5 | 114 | $14,820 | $89,570 | $180 | $14,640 | $88,155 |

Note: MRR uses blended ASP of $130 (85% Solo at $99 + 15% Team at $299). Churn applied as 5% of previous month total, rounded.

## Scenario Summary

| Metric | Conservative | Baseline | Optimistic |
|---|---|---|---|
| Month 6 MRR | $2,700 | $6,500 | $13,200 |
| Month 6 Total Customers | 27 | 50 | 80 |
| Month 12 MRR | $6,500 | $14,820 | $35,750 |
| Month 12 Total Customers | 65 | 114 | 215 |
| Cumulative Revenue (12 mo) | $42,800 | $89,570 | $198,000 |
| Cumulative Costs (12 mo) | $1,560 | $1,315 | $1,315 |
| Cumulative Profit/Loss (12 mo) | $41,240 | $88,255 | $196,685 |

## Unit Economics

| Metric | Value | Assessment |
|---|---|---|
| Customer Acquisition Cost (CAC) | $175 | Low for B2B SaaS — primarily founder time |
| Lifetime Value (LTV) | $2,340 | $130 ASP × 18 months average lifetime |
| LTV:CAC Ratio | 13.4:1 | Exceptional (target 3:1+) |
| Months to Recover CAC | 1.3 | Excellent — customer profitable in first 2 months |
| Break-even Month | 1 | First customer covers monthly infrastructure |
| Break-even Customer Count | 1 | $55 monthly cost / $130 ASP = 0.4 customers |

## "Worth Building?" Assessment

1. **Does the baseline scenario produce meaningful income within 6 months?** Yes. Month 6 MRR is $6,500 ($78K ARR). Even the Conservative scenario reaches $2,700 MRR by Month 6.

2. **Is the CAC sustainable?** Yes. At 2.3 hours per customer, the founder can acquire 3–4 customers per week while maintaining product and support. Agent-assisted outreach (Month 2+) reduces this further.

3. **Does LTV:CAC justify the effort?** Emphatically yes. 13.4:1 is exceptional. Even if actual LTV is half the projection (9 months instead of 18), the ratio is 6.7:1 — still excellent.

4. **What's the biggest financial risk?** Churn. If monthly churn is 10% instead of 5%, Month 12 MRR drops from $14,820 to approximately $9,500. Still profitable, but growth slows significantly. Mitigation: invest in accuracy (the #1 retention driver) and onboarding.

5. **Go/No-Go on the numbers**: GO. The unit economics are strong, break-even is immediate, and even the Conservative scenario produces a viable solo business. The product is worth building.

## Revenue-Driven Infrastructure Triggers

- $500 MRR (Month 2–3 baseline): Tier 2 justified — Supabase Pro, error monitoring
- $2,000 MRR (Month 3 baseline): Tier 3 justified — enhanced monitoring, analytics
- $5,000 MRR (Month 5 baseline): Begin SOC 2 planning
- Baseline hits $500 MRR in Month 1. Tier 2 can be introduced early.

## How to Update This Forecast

### Monthly Reconciliation Process
1. On the 1st of each month, fill in actual numbers next to projections
2. For any metric diverging >20% from baseline:
   a. Identify which assumption was wrong
   b. Update the assumption with actual data
   c. Re-project remaining months
3. Keep historical actuals — don't overwrite, add a new column

### Which Assumptions to Revise First
- If MRR is low: check new customers/month (acquisition issue) vs. churn (retention issue)
- If CAC is high: check hours per customer — is outreach taking longer than expected?
- If churn is high: check shreds/user (engagement) and support tickets (quality)
- If ASP is different: check mix of Solo vs. Team subscribers

### Template for Monthly Update

```markdown
## Month [X] Reconciliation — [Date]

| Metric | Forecast | Actual | Variance | Notes |
|---|---|---|---|---|
| New customers | X | X | +/-X% | |
| Churn | X | X | +/-X% | |
| Total active | X | X | +/-X% | |
| MRR | $X | $X | +/-X% | |
| CAC | $X | $X | +/-X% | |
| Infrastructure cost | $X | $X | +/-X% | |

### Assumptions Updated
- [assumption]: changed from [old] to [new] because [reason]

### Revised Projection (if needed)
- Month [X+1] MRR: $X (was $X)
- Month 12 MRR: $X (was $X)
```

## Changelog

| Date | Change | Reason |
|---|---|---|
| [Launch date] | Initial forecast created from Stage 1 analysis | — |
STAGE1EOF

echo "  ✓ docs/REVENUE-FORECAST.md"

# ────────────────────────────────────────
# docs/architecture/system-overview.md
# ────────────────────────────────────────
cat > docs/architecture/system-overview.md << 'STAGE1EOF'
# RFP Shredder — System Architecture Overview
# Path: docs/architecture/system-overview.md
# Purpose: Complete technical architecture reference
# Created: Stage 1 Strategy Session

## System Architecture

### Processing Pipeline

```
USER BROWSER                    VERCEL SERVERLESS
     |                               |
     | 1. Upload PDF/DOCX            |
     |------------------------------>|
     |                               |  2. Validate: MIME, magic bytes,
     |                               |     size (50MB), extension
     |                               |
     |                               |  3. Parse: pdfplumber (PDF) or
     |                               |     mammoth.js (DOCX)
     |                               |     Output: structured text with
     |                               |     section markers + page numbers
     |                               |
     |                               |  4. Chunk: split into segments
     |                               |     <= 100K tokens, 50-token overlap
     |                               |
     |                               |  5. Extract: send each chunk to
     |                               |     Claude Sonnet API with
     |                               |     extraction prompt
     |                               |     Output: JSON requirements array
     |                               |
     |                               |  6. Deduplicate: merge overlapping
     |                               |     requirements from chunk boundaries
     |                               |
     |                               |  7. Cross-reference: map L reqs
     |                               |     to M evaluation factors
     |                               |
     |                               |  8. Generate: ExcelJS builds
     |                               |     formatted compliance matrix
     |                               |
     | 9. Stream Excel download       |
     |<------------------------------|
     |                               |  10. Purge: null all variables,
     |                               |      /tmp auto-cleans on
     |                               |      function termination
```

### Component Map

| Component | Technology | Location | Purpose |
|---|---|---|---|
| Landing Page | Next.js + Tailwind | src/app/page.tsx | Marketing, conversion |
| Auth | Supabase Auth | src/app/(auth)/ | Login, signup, magic link |
| Dashboard | Next.js | src/app/dashboard/ | Shred history, upload, settings |
| Upload Handler | Next.js API Route | src/app/api/shred/route.ts | File validation, orchestration |
| PDF Parser | Python + pdfplumber | api/parse-pdf/index.py | Text extraction from PDF |
| DOCX Parser | mammoth.js | src/lib/shredder/docx-parser.ts | Text extraction from DOCX |
| Section Detector | TypeScript | src/lib/shredder/section-detector.ts | Find L, M, attachment sections |
| Chunker | TypeScript | src/lib/shredder/chunker.ts | Split text for API limits |
| Extractor | TypeScript + Claude API | src/lib/shredder/extractor.ts | Requirement extraction |
| Cross-Ref Engine | TypeScript | src/lib/shredder/crossref.ts | L-to-M mapping |
| Excel Generator | ExcelJS | src/lib/shredder/excel-generator.ts | Formatted matrix output |
| Billing | Stripe | src/app/api/billing/ | Checkout, webhooks, portal |
| Email | Resend | src/lib/email/ | Transactional emails |
| Middleware | Next.js | src/middleware.ts | Auth, headers, rate limiting |

### Database Schema

```sql
-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due')),
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'solo', 'team', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  subscription_price INTEGER,  -- cents, for MRR calculation
  trial_shreds_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Shred Log (metadata only — NEVER stores document content)
CREATE TABLE shred_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  page_count INTEGER NOT NULL,
  requirement_count INTEGER NOT NULL,
  obligation_breakdown JSONB,  -- {"shall": 15, "must": 8, "should": 3, "may": 1}
  processing_time_ms INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shred_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own shreds"
  ON shred_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts shreds"
  ON shred_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_shred_log_user_id ON shred_log(user_id);
CREATE INDEX idx_shred_log_created_at ON shred_log(created_at);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Auto-delete shred logs older than 90 days (run via cron or Supabase scheduled function)
-- DELETE FROM shred_log WHERE created_at < now() - INTERVAL '90 days';
```

### Infrastructure Cost Tiers

| Tier | Monthly Cost | When to Activate | Services |
|---|---|---|---|
| Tier 0 (Launch) | $32–$55 | Day 1 | Vercel Pro ($20), domain ($1), Anthropic API (~$15–30) |
| Tier 1 (First customers) | $55–$91 | First paying customer | Same + higher API usage |
| Tier 2 (Growth) | $120–$200 | $500 MRR (~Month 2–3) | + Supabase Pro ($25), Sentry ($26), Plausible ($9) |
| Tier 3 (Scale) | $250–$400 | $2,000 MRR (~Month 3–4) | + Enhanced monitoring, analytics, CDN optimization |

### API Cost Per Shred

Estimated Claude Sonnet API cost per shred:
- 100-page RFP: ~$0.30 (1 chunk, ~50K input tokens)
- 200-page RFP: ~$0.55 (2 chunks)
- 300-page RFP: ~$0.80 (3 chunks)
- At $130 ASP and 5 shreds/month/user: API cost = $1.50–$4.00/user/month (1–3% of revenue)

### Rate Limits

| Endpoint | Limit | Scope |
|---|---|---|
| /api/shred | 10 requests/hour | Per user |
| /api/auth/login | 5 attempts/15 min | Per IP |
| /api/auth/signup | 3 accounts/hour | Per IP |
| /api/billing/* | 20 requests/minute | Per user |
STAGE1EOF

echo "  ✓ docs/architecture/system-overview.md"

# ────────────────────────────────────────
# docs/architecture/security-model.md
# ────────────────────────────────────────
cat > docs/architecture/security-model.md << 'STAGE1EOF'
# RFP Shredder — Security Model
# Path: docs/architecture/security-model.md
# Purpose: Complete security architecture documentation
# Created: Stage 1 Strategy Session

## Core Principle: Zero Document Retention

RFP Shredder processes government RFP documents that may contain sensitive
procurement information. Our security model is built on a single,
non-negotiable principle: we never store your documents.

## Data Flow and Storage

### What Happens to Your Document

1. **Upload**: Your file is received by a Vercel serverless function. It is
   written to ephemeral /tmp storage (RAM-backed, function-scoped).

2. **Parsing**: The document text is extracted in memory by pdfplumber (PDF)
   or mammoth.js (DOCX). The parsed text exists only in function memory.

3. **Extraction**: Text chunks are sent to the Anthropic Claude API for
   requirement analysis. Anthropic's API:
   - Does NOT store input data
   - Does NOT train on customer data
   - Is covered by a Data Processing Agreement (DPA) confirming zero retention
   - Processes data in transit (HTTPS/TLS 1.3)

4. **Excel Generation**: The compliance matrix is built in memory using
   ExcelJS and streamed directly to your browser as a download.

5. **Cleanup**: When the serverless function completes (whether successfully
   or with an error), ALL data is purged:
   - /tmp is automatically cleared by Vercel's runtime
   - All in-memory variables are garbage collected
   - There is nothing to delete because nothing was persisted

### What We Store (Exhaustive List)

| Data | Location | Purpose | Retention |
|---|---|---|---|
| Email address | Supabase | Account authentication | Until account deletion |
| Full name | Supabase | Display name | Until account deletion |
| Hashed password | Supabase Auth | Authentication | Until account deletion |
| Stripe customer ID | Supabase | Billing link | Until account deletion |
| Subscription status | Supabase | Access control | Until account deletion |
| Shred timestamp | Supabase | Usage tracking | 90 days |
| Page count | Supabase | Usage analytics | 90 days |
| Requirement count | Supabase | Usage analytics | 90 days |
| Obligation breakdown (counts) | Supabase | Usage analytics | 90 days |
| Processing time (ms) | Supabase | Performance monitoring | 90 days |
| Success/failure status | Supabase | Error tracking | 90 days |

### What We NEVER Store

- Document content (text, images, tables)
- Requirement text
- File names
- RFP identifiers or solicitation numbers
- Agency names extracted from documents
- The compliance matrix output
- Any data that could identify which RFP was processed

## Security Controls

### Transport Security
- All traffic encrypted via TLS 1.3 (enforced by Vercel)
- HSTS header with 1-year max-age, includeSubDomains, preload
- No mixed content allowed

### Authentication
- Supabase Auth with email/password and magic link options
- JWT-based session management
- Rate-limited login attempts (5 per IP per 15 minutes)

### Authorization
- Row Level Security (RLS) on ALL Supabase tables
- Users can only access their own data
- Service role client used only in webhook handlers

### HTTP Security Headers
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Content-Security-Policy: default-src 'self'; [full CSP]

### Input Validation
- All file uploads validated: MIME type, file extension, AND magic bytes
- File size limit: 50MB
- Page count limit: 300 pages
- All API request bodies validated with Zod schemas (strict mode)
- No raw SQL — all queries through Supabase client

### Secrets Management
- All API keys and secrets in environment variables
- .env.local gitignored
- Server-only keys never prefixed with NEXT_PUBLIC_
- Vercel environment variables set via dashboard

## Compliance Roadmap

| Certification | Timeline | Trigger |
|---|---|---|
| Zero-retention architecture | Day 1 | Core product design |
| Anthropic DPA | Day 1 | API terms cover zero-training |
| SOC 2 Type II | Month 9+ | $5,000+ MRR threshold |
| FedRAMP (if needed) | Year 2+ | $15,000+ MRR, enterprise demand |
| On-premise deployment | TBD | Enterprise customer demand |

## Incident Response

If a security incident is suspected:
1. Immediately assess: is any customer data at risk?
2. Because we store no document content, the impact surface is limited to:
   account data (emails, names, subscription status)
3. If account data is compromised: notify affected users within 72 hours
4. If the application is compromised: take the service offline, investigate,
   fix, and communicate transparently
5. Document the incident and root cause
6. Implement preventive measures
STAGE1EOF

echo "  ✓ docs/architecture/security-model.md"

# ────────────────────────────────────────
# qa/QA-STRATEGY.md
# ────────────────────────────────────────
cat > qa/QA-STRATEGY.md << 'STAGE1EOF'
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
STAGE1EOF

echo "  ✓ qa/QA-STRATEGY.md"

# ────────────────────────────────────────
# qa/test-specs/auth.md
# ────────────────────────────────────────
cat > qa/test-specs/auth.md << 'STAGE1EOF'
# Test Specification: Authentication System
# Path: qa/test-specs/auth.md

## Acceptance Criteria
- [ ] User can sign up with email and password
- [ ] User can sign up with magic link
- [ ] User can log in with email and password
- [ ] User can log in with magic link
- [ ] User can log out
- [ ] Protected routes redirect unauthenticated users to /login
- [ ] JWT tokens are validated on every protected API route
- [ ] Rate limiting: max 5 login attempts per IP per 15 minutes
- [ ] Rate limiting: max 3 signups per IP per hour
- [ ] Profile is auto-created on first signup
- [ ] Password reset flow works end-to-end

## Unit Tests Required
- Test: validateEmail("valid@email.com") -> Expected: true
- Test: validateEmail("invalid") -> Expected: false
- Test: validatePassword("short") -> Expected: false (min 8 chars)
- Test: validatePassword("ValidPass123!") -> Expected: true
- Test: createProfile(userId) -> Expected: profile record with correct defaults

## Integration Tests Required
- Test: POST /api/auth/signup with valid credentials -> Expected: 200, user created, profile created
- Test: POST /api/auth/signup with existing email -> Expected: 409 or appropriate error
- Test: POST /api/auth/login with valid credentials -> Expected: 200, JWT returned
- Test: POST /api/auth/login with invalid password -> Expected: 401, generic message
- Test: GET /api/shred without JWT -> Expected: 401
- Test: GET /api/shred with expired JWT -> Expected: 401
- Test: GET /api/shred with valid JWT -> Expected: 200 (or appropriate non-401)
- Test: RLS verification — user A cannot read user B's profile

## E2E / Browser Tests Required
- Flow: Visit /signup -> fill form -> submit -> redirected to /dashboard
- Flow: Visit /login -> fill form -> submit -> redirected to /dashboard
- Flow: Visit /dashboard without auth -> redirected to /login
- Flow: Click logout -> redirected to /login -> /dashboard inaccessible
- Viewport checks: desktop, tablet, mobile (signup and login forms usable)
- Lighthouse minimum scores: Performance 80+, Accessibility 90+

## Security Tests Required
- Test: SQL injection in email field -> Expected: rejected by Zod validation
- Test: XSS payload in name field -> Expected: sanitized/rejected
- Test: 6th login attempt within 15 min -> Expected: 429 rate limited
- Test: 4th signup from same IP within 1 hour -> Expected: 429 rate limited
- Test: Accessing /api/billing/webhook without Stripe signature -> Expected: 401

## Edge Cases
- Signup with email containing + alias (user+test@email.com) -> Expected: works
- Login with wrong case email (USER@email.com) -> Expected: works (case insensitive)
- Double-click signup button -> Expected: only one account created

## What "Done" Looks Like
A user can create an account, log in, see their dashboard, and log out. Unauthenticated users cannot access any protected page or API. Login attempts are rate limited. All auth errors show generic messages (no information leakage).
STAGE1EOF

echo "  ✓ qa/test-specs/auth.md"

# ────────────────────────────────────────
# qa/test-specs/core-product.md
# ────────────────────────────────────────
cat > qa/test-specs/core-product.md << 'STAGE1EOF'
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
STAGE1EOF

echo "  ✓ qa/test-specs/core-product.md"

# ────────────────────────────────────────
# qa/test-specs/billing.md
# ────────────────────────────────────────
cat > qa/test-specs/billing.md << 'STAGE1EOF'
# Test Specification: Billing System
# Path: qa/test-specs/billing.md

## Acceptance Criteria
- [ ] User can initiate Stripe Checkout for Solo plan ($99/month)
- [ ] Successful checkout creates/updates subscription in profiles table
- [ ] User can access Stripe Customer Portal to manage subscription
- [ ] Webhook handles: checkout.session.completed
- [ ] Webhook handles: customer.subscription.updated
- [ ] Webhook handles: customer.subscription.deleted
- [ ] Webhook handles: invoice.payment_failed
- [ ] Webhook signature is verified on every request
- [ ] Duplicate webhook events are handled idempotently
- [ ] Trial user is limited to 1 shred (100 pages)
- [ ] Active subscriber has unlimited shreds (300 pages)
- [ ] Canceled subscriber loses shred access at period end

## Unit Tests Required
- Test: createCheckoutSession(userId, priceId) -> Expected: valid Stripe session URL
- Test: handleWebhook(invalid-signature) -> Expected: 401
- Test: handleWebhook(checkout.session.completed) -> Expected: profile updated to active
- Test: handleWebhook(customer.subscription.deleted) -> Expected: profile updated to canceled
- Test: handleWebhook(duplicate-event-id) -> Expected: 200, no duplicate processing
- Test: canShred(trialUser, 0 shreds) -> Expected: true
- Test: canShred(trialUser, 1 shred) -> Expected: false
- Test: canShred(activeSubscriber, 100 shreds) -> Expected: true
- Test: canShred(canceledUser, 0 shreds) -> Expected: false

## Integration Tests Required
- Test: POST /api/billing/checkout with auth -> Expected: 200, Stripe URL returned
- Test: POST /api/billing/checkout without auth -> Expected: 401
- Test: POST /api/billing/webhook with valid Stripe signature -> Expected: 200
- Test: POST /api/billing/webhook without signature -> Expected: 401
- Test: POST /api/billing/portal with auth -> Expected: 200, portal URL returned
- Test: Full cycle: checkout -> webhook -> profile updated -> user can shred

## E2E / Browser Tests Required
- Flow: Click Subscribe -> Stripe Checkout (test mode) -> Complete payment -> Redirected to dashboard -> Subscription status shows "Active"
- Flow: Dashboard shows correct plan name and status
- Flow: Pricing page displays all tiers correctly on desktop, tablet, mobile

## Security Tests Required
- Test: Forge webhook payload without valid signature -> Expected: 401
- Test: Manipulate client-side price data -> Expected: price set server-side via Stripe, manipulation has no effect
- Test: Access another user's billing portal -> Expected: denied (user can only access own)

## Edge Cases
- User completes checkout but webhook is delayed -> Expected: polling or eventual consistency
- User cancels mid-checkout -> Expected: no subscription created, no profile change
- Stripe is temporarily unreachable -> Expected: graceful error, user can retry
- User has past_due invoice -> Expected: shown appropriate message, can update payment method

## What "Done" Looks Like
A user clicks "Subscribe," completes Stripe Checkout with a test card, is redirected back to the dashboard which now shows "Solo Plan — Active," and can immediately shred unlimited RFPs. When they cancel via the portal, their access continues until period end, then stops.
STAGE1EOF

echo "  ✓ qa/test-specs/billing.md"

# ────────────────────────────────────────
# qa/test-specs/landing-page.md
# ────────────────────────────────────────
cat > qa/test-specs/landing-page.md << 'STAGE1EOF'
# Test Specification: Landing Page
# Path: qa/test-specs/landing-page.md

## Acceptance Criteria
- [ ] All 10 sections from .claude/skills/landing-page.md are present
- [ ] Hero section: headline, subhead, CTA button, trust badge
- [ ] Pain section: addresses manual compliance matrix process
- [ ] How it works: 3-step visual explanation
- [ ] Comparison section: manual process vs. RFP Shredder table
- [ ] Security section: zero-retention architecture explained
- [ ] Pricing section: Free Trial, Solo ($99), Team (coming soon), Enterprise (contact)
- [ ] Social proof section: testimonial placeholders
- [ ] FAQ section: 6 questions answered
- [ ] Final CTA section
- [ ] Footer with links
- [ ] Page loads < 3 seconds on Fast 3G
- [ ] Lighthouse: Performance 80+, Accessibility 90+, SEO 80+, BP 80+
- [ ] Mobile responsive at all breakpoints
- [ ] All CTA buttons link to /signup
- [ ] No broken links

## E2E / Browser Tests Required
- Flow: Visit / -> All 10 sections visible -> Click CTA -> Navigates to /signup
- Flow: Scroll through entire page on mobile -> All content readable
- Viewport: desktop (1920x1080) — screenshot and verify layout
- Viewport: tablet (768x1024) — screenshot and verify layout
- Viewport: mobile (375x812) — screenshot and verify layout
- Performance: Lighthouse audit meets minimums

## Security Tests Required
- Test: Check all security headers present on / response
- Test: Check CSP header allows required resources (Stripe JS, Supabase)
- Test: Check no inline scripts without nonce (CSP compliance)

## Edge Cases
- JavaScript disabled -> Expected: content still readable (SSR)
- Slow connection (Fast 3G) -> Expected: meaningful content visible within 3 seconds
- Screen reader -> Expected: logical heading hierarchy, alt text on images, ARIA labels

## What "Done" Looks Like
A Proposal Manager visits the landing page, immediately understands what the product does (compliance matrix generation), sees the comparison to their manual process, reads the security section, views pricing, and clicks "Shred Your First RFP Free" — all within 60 seconds. The page is professional, fast, and works on their phone.
STAGE1EOF

echo "  ✓ qa/test-specs/landing-page.md"

# ────────────────────────────────────────
# qa/test-specs/email-system.md
# ────────────────────────────────────────
cat > qa/test-specs/email-system.md << 'STAGE1EOF'
# Test Specification: Email System
# Path: qa/test-specs/email-system.md

## Acceptance Criteria
- [ ] Welcome email sends on signup
- [ ] Trial completion email sends after free shred (with stats)
- [ ] Trial nudge email sends 24 hours after trial if not subscribed
- [ ] Subscription confirmation email sends on checkout.session.completed
- [ ] Cancellation email sends on customer.subscription.deleted
- [ ] Payment failure email sends on invoice.payment_failed
- [ ] All emails render correctly in major email clients
- [ ] All emails contain unsubscribe mechanism
- [ ] All emails use correct sender domain
- [ ] No PII beyond email address in email logs

## Unit Tests Required
- Test: getTemplate("welcome", {first_name: "Sarah"}) -> Expected: valid HTML with personalization
- Test: getTemplate("trial_completion", {requirement_count: 47, shall_count: 15}) -> Expected: valid HTML with stats
- Test: sendEmail({to, type, data}) -> Expected: Resend API called with correct params
- Test: sendEmail with Resend error -> Expected: retry once, then log failure

## Integration Tests Required
- Test: Trigger signup -> Verify welcome email sent via Resend API
- Test: Trigger trial shred completion -> Verify trial completion email with correct stats
- Test: Trigger Stripe webhook (subscription created) -> Verify confirmation email
- Test: Trigger Stripe webhook (subscription deleted) -> Verify cancellation email

## Edge Cases
- Resend API is down -> Expected: email queued for retry, user flow not blocked
- User email bounces -> Expected: logged, no retry spam
- User signs up and immediately subscribes (within 30 seconds) -> Expected: welcome + confirmation, no trial nudge

## What "Done" Looks Like
Every transactional email fires at the right time with the right content. Emails are simple, professional, and render correctly. The founder can see email delivery status in the Resend dashboard.
STAGE1EOF

echo "  ✓ qa/test-specs/email-system.md"

# ────────────────────────────────────────
# qa/test-specs/outreach-automation.md
# ────────────────────────────────────────
cat > qa/test-specs/outreach-automation.md << 'STAGE1EOF'
# Test Specification: Outreach Automation
# Path: qa/test-specs/outreach-automation.md
# Note: Outreach system is built in Stage 2 but DORMANT until 10+ manual conversions

## Acceptance Criteria
- [ ] Prospect scoring produces Reachability, Intent, Decision Speed (1-5 each)
- [ ] Prospects scoring 4+ on all three enter active_outreach queue
- [ ] Prospects below 4 on any dimension go to nurture list with logged reason
- [ ] Every prospect is tagged with current_alternative
- [ ] Email templates are selected based on current_alternative tag
- [ ] First-touch emails require Tier 3 approval
- [ ] Follow-up emails are Tier 2 (auto-send with notification)
- [ ] Maximum 50 emails/day enforced
- [ ] Maximum 3 follow-ups per prospect enforced
- [ ] 48-hour cooldown between emails enforced
- [ ] Unsubscribe link in every email
- [ ] Do-not-contact list checked before every outreach action

## Unit Tests Required
- Test: scoreProspect(high-quality-data) -> Expected: scores 4+ on all dimensions
- Test: scoreProspect(low-intent-data) -> Expected: intent below 4, gate result "nurture"
- Test: tagAlternative(deltek-evidence) -> Expected: "direct_competitor"
- Test: tagAlternative(no-evidence) -> Expected: "manual_workaround" (default)
- Test: selectTemplate("manual_workaround") -> Expected: manual-workaround.md template
- Test: checkCooldown(last_email_20_hours_ago) -> Expected: false (not met)
- Test: checkCooldown(last_email_50_hours_ago) -> Expected: true (met)
- Test: checkDoNotContact(blocked_email) -> Expected: true (blocked)

## Integration Tests Required
- Test: Full pipeline: discover -> score -> gate -> tag -> draft email -> queue for approval
- Test: Approval -> send -> log in action log
- Test: Rejection -> cancel -> log rejection reason
- Test: Daily email count at 50 -> next email blocked with "DAILY_LIMIT_REACHED"

## Security Tests Required
- Test: Prospect PII is hashed in action logs (no raw email addresses in logs)
- Test: Do-not-contact list cannot be bypassed by any agent action
- Test: Tier 4 actions (financial, legal) are blocked with alert

## What "Done" Looks Like
The outreach system discovers prospects, scores them, filters out unqualified leads, tags their current alternative, selects the right email template, and queues personalized emails for founder approval. Safety boundaries are enforced at every step.
STAGE1EOF

echo "  ✓ qa/test-specs/outreach-automation.md"

# ────────────────────────────────────────
# qa/test-specs/autonomous-agents.md
# ────────────────────────────────────────
cat > qa/test-specs/autonomous-agents.md << 'STAGE1EOF'
# Test Specification: Autonomous Agent System
# Path: qa/test-specs/autonomous-agents.md

## Acceptance Criteria
- [ ] Tier 1 actions execute without approval
- [ ] Tier 2 actions execute and generate notification
- [ ] Tier 3 actions queue for approval and wait
- [ ] Tier 4 actions are blocked with immediate alert
- [ ] Safety boundaries enforced (email limits, cooldowns, scoring gates)
- [ ] Emergency stop halts all agent actions
- [ ] Action log records every agent action
- [ ] Daily digest generated and delivered at 08:00 ET
- [ ] Approval queue correctly handles approve/reject/defer/expire

## Unit Tests Required
- Test: classifyAction("research_prospect") -> Expected: tier 1
- Test: classifyAction("send_first_touch_email") -> Expected: tier 3
- Test: classifyAction("change_pricing") -> Expected: tier 4
- Test: enforceSafetyBoundary(51st_email_today) -> Expected: blocked
- Test: enforceSafetyBoundary(email_to_do_not_contact) -> Expected: blocked
- Test: triggerEmergencyStop() -> Expected: all agents paused, queues cleared

## Integration Tests Required
- Test: Tier 3 action submitted -> appears in approval queue -> approved -> executed
- Test: Tier 3 action submitted -> not acted on for 48 hours -> expired
- Test: Emergency stop triggered -> all agents verified paused
- Test: Action log query: count emails sent today -> returns correct count

## Security Tests Required
- Test: Agent attempts Tier 4 action -> blocked, alert generated
- Test: Agent attempts to modify safety-boundaries.yaml -> blocked
- Test: Agent attempts to modify autonomy-levels.yaml -> blocked

## What "Done" Looks Like
The autonomous system runs daily operations with appropriate guardrails. Tier 1 actions happen silently. Tier 2 actions appear in the daily digest. Tier 3 actions wait in the approval queue. Tier 4 actions are impossible. The founder spends ~25 minutes/day reviewing and approving.
STAGE1EOF

echo "  ✓ qa/test-specs/autonomous-agents.md"

# ────────────────────────────────────────
# qa/test-specs/deployment.md
# ────────────────────────────────────────
cat > qa/test-specs/deployment.md << 'STAGE1EOF'
# Test Specification: Deployment
# Path: qa/test-specs/deployment.md

## Acceptance Criteria
- [ ] Application deploys to Vercel without errors
- [ ] Custom domain resolves correctly with HTTPS
- [ ] All environment variables set in Vercel dashboard
- [ ] Database migrations applied to production Supabase
- [ ] Stripe webhooks configured for production URL
- [ ] Resend domain verified for production sending
- [ ] All security headers present in production responses
- [ ] Health check endpoint returns 200
- [ ] No console errors on any production page

## Integration Tests Required
- Test: curl -I https://yourdomain.com -> Expected: 200, all security headers present
- Test: curl https://yourdomain.com/api/health -> Expected: 200 {"status": "ok"}
- Test: Stripe test webhook to production URL -> Expected: 200
- Test: Visit every public page -> Expected: no console errors, correct rendering

## Security Tests Required
- Test: HTTPS enforced (HTTP redirects to HTTPS)
- Test: HSTS header present with correct max-age
- Test: No sensitive environment variables exposed in client bundle
- Test: Source maps not accessible in production

## What "Done" Looks Like
The application is live on a custom domain with HTTPS, all services connected, and all health checks passing. A user can visit the landing page, sign up, shred an RFP, and subscribe — all in production.
STAGE1EOF

echo "  ✓ qa/test-specs/deployment.md"

# ────────────────────────────────────────
# qa/test-specs/full-integration.md
# ────────────────────────────────────────
cat > qa/test-specs/full-integration.md << 'STAGE1EOF'
# Test Specification: Full Integration Tests
# Path: qa/test-specs/full-integration.md
# Purpose: End-to-end user journeys that test the complete system

## Journey 1: New User Trial Experience
1. Visit landing page -> read content -> click "Shred Your First RFP Free"
2. Sign up with email and password
3. Redirected to dashboard
4. Click "Shred an RFP"
5. Upload a 100-page PDF
6. See processing progress indicators
7. Download formatted Excel compliance matrix
8. Verify: Excel has correct columns, formatting, requirements
9. Try to shred again -> see "Subscribe to continue" message
Expected: Complete flow works end-to-end in under 5 minutes

## Journey 2: Subscriber Ongoing Usage
1. Log in as existing subscriber
2. Shred a 200-page PDF -> download matrix
3. Shred a 150-page DOCX -> download matrix
4. View shred history on dashboard (shows metadata, not content)
5. Click "Manage Subscription" -> Stripe portal opens
Expected: All actions complete, shred history shows correct metadata

## Journey 3: Billing Lifecycle
1. Sign up -> complete trial shred
2. Click Subscribe -> Stripe Checkout -> complete with test card
3. Dashboard shows "Solo Plan - Active"
4. Shred an RFP (confirms paid access works)
5. Go to Stripe portal -> cancel subscription
6. Dashboard shows "Cancels at period end"
7. After period end: shred attempt blocked
Expected: Full subscription lifecycle works correctly

## Journey 4: Error Handling
1. Upload a .exe file renamed to .pdf -> see clear error
2. Upload a 60MB file -> see "File too large" error
3. Upload a scanned PDF -> see "Scanned PDFs not yet supported" message
4. Upload a PDF with no Section L/M -> see helpful error message
5. All errors: user can try again without refreshing
Expected: Every error produces a clear, helpful message

## Journey 5: Security Verification
1. Try accessing /dashboard without login -> redirected to /login
2. Try accessing /api/shred without JWT -> 401 response
3. Check all security headers on every page (curl -I)
4. Verify no document content in database (query shred_log)
5. Verify no console errors or warnings on any page
Expected: All security measures verified and working

## Lighthouse Requirements (Run on Production)
- Landing page: Performance 80+, Accessibility 90+, SEO 80+, BP 80+
- Dashboard: Performance 80+, Accessibility 90+
- Login/Signup: Performance 80+, Accessibility 90+

## What "Done" Looks Like
All 5 journeys complete successfully. A real person could use this product right now — sign up, try it free, subscribe, shred RFPs, manage their billing, and handle every error gracefully.
STAGE1EOF

echo "  ✓ qa/test-specs/full-integration.md"

# ────────────────────────────────────────
# qa/test-corpus/README.md
# ────────────────────────────────────────
cat > qa/test-corpus/README.md << 'STAGE1EOF'
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
STAGE1EOF

echo "  ✓ qa/test-corpus/README.md"

# ────────────────────────────────────────
# .agents/product-builder.md
# ────────────────────────────────────────
cat > .agents/product-builder.md << 'STAGE1EOF'
# Agent: Product Builder
# Path: .agents/product-builder.md
# Purpose: Primary build agent for Stage 2 — builds all application code
# Model: Claude Sonnet (code generation) / Claude Opus (architecture decisions)
# Autonomy Tier: Tier 1 (build tasks) / Tier 3 (architecture changes)

## Role
You are the primary build agent for the RFP Shredder. You build application
code following the Stage 2 build brief (claude.md) and test specifications
(qa/test-specs/). You follow the Build-Verify-Learn loop for every component.

## Build Sequence (7 Phases, 14 Days)
- Phase 1: Foundation (auth, DB schema, middleware) — Day 1
- Phase 2: Core Pipeline - Parsing (pdfplumber, mammoth, section detection) — Day 2
- Phase 3: Core Pipeline - Extraction (chunking, Claude API, prompt) — Day 3
- Phase 4: Core Pipeline - Cross-Reference + Excel (mapping, ExcelJS) — Day 4
- Phase 5: Billing (Stripe Checkout, webhooks, trial logic) — Day 5
- Phase 6: Landing Page + Email (all sections, Resend integration) — Day 6
- Phase 7: Security Hardening + Integration Testing — Day 7

## For Each Phase
1. READ the relevant test spec (qa/test-specs/{component}.md)
2. READ relevant rules (.claude/rules/) and skills (.claude/skills/)
3. BUILD the component
4. TEST against the spec
5. FIX failures (max 3 attempts, then escalate)
6. REVIEW using the code review checklist (qa/QA-STRATEGY.md)
7. LOG to PROGRESS.md and LESSONS.md
8. MOVE to next phase only after all tests pass

## Safety Boundaries
- NEVER store document content in any persistent storage
- NEVER expose API keys in client-side code
- NEVER skip test specs or mark components complete with failing tests
- NEVER use paid infrastructure beyond Vercel Pro without documenting why
- ALWAYS validate external inputs with Zod
- ALWAYS handle errors gracefully with user-friendly messages
- ALWAYS check LESSONS.md before starting a new component

## Self-Correction Protocol
- Test fails -> diagnose root cause -> fix -> re-test (max 3 loops)
- Code review fails -> diagnose -> fix -> re-review (max 2 loops)
- Browser test fails -> screenshot -> diagnose -> fix -> re-verify (max 3 loops)
- Still failing after max loops -> escalate to user with full diagnosis
STAGE1EOF

echo "  ✓ .agents/product-builder.md"

# ────────────────────────────────────────
# .agents/outreach-agent.md
# ────────────────────────────────────────
cat > .agents/outreach-agent.md << 'STAGE1EOF'
# Agent: Outreach Agent
# Path: .agents/outreach-agent.md
# Purpose: Manage prospect outreach pipeline from scoring to sending
# Model: Claude Sonnet (scoring/decisions) / Gemini Flash (email generation)
# Autonomy: Tier 1 (research/scoring) / Tier 2 (follow-ups) / Tier 3 (first-touch)
# IMPORTANT: Built in Stage 2 but DORMANT until founder manually converts 10+ customers

## Role
You manage the outreach pipeline: prospect research, scoring, tagging,
email generation, and send management. You ensure only qualified prospects
(4+ on Reachability, Intent, Decision Speed) enter the outreach queue, and
that emails are segmented by the prospect's current alternative.

## Prospect Scoring Gate
Before any prospect enters the outreach queue, score:
- Reachability (1-5): Can we contact them directly?
- Intent Signal (1-5): Have they shown they need a solution?
- Decision Speed (1-5): Can they buy without procurement?

Gate: 4+ on ALL THREE to enter active queue. Below 4 -> nurture list.

## Current Alternative Tagging
Every prospect gets tagged: direct_competitor, indirect_tool,
manual_workaround (default), or status_quo. Tag determines email template.

## Safety Boundaries
- Max 50 emails/day, max 3 follow-ups/prospect, 48hr cooldown
- Require unsubscribe link in every email
- Check do-not-contact list before every action
- Hash PII before logging
- Never make unverified accuracy claims
- Never disparage competitors by name

## Escalation Rules
- Security questions from prospects -> founder immediately
- Enterprise interest -> founder immediately
- Hostile/legal responses -> founder + pause outreach to that company
- Response rate < 5% for 7 consecutive days -> alert + recommend review
STAGE1EOF

echo "  ✓ .agents/outreach-agent.md"

# ────────────────────────────────────────
# .agents/email-writer.md
# ────────────────────────────────────────
cat > .agents/email-writer.md << 'STAGE1EOF'
# Agent: Email Writer
# Path: .agents/email-writer.md
# Purpose: Generate personalized email copy (does NOT send — outreach-agent sends)
# Model: Gemini Flash (volume) / Claude Haiku (quick templates)
# Autonomy: Tier 1 (drafting) / Tier 3 (new template creation)

## Role
You generate personalized email copy for outreach. You select the correct
template based on the prospect's current_alternative tag, personalize it
with prospect data, and submit it for review. You never send emails directly.

## Writing Rules (STRICT)
1. Max 6 sentences for cold outreach, 2-3 for follow-ups
2. Lead with THEIR pain, not our product
3. One specific, quantified claim ("200-page RFP -> compliance matrix in 2 minutes")
4. One sentence about security in every cold email
5. One CTA per email
6. No buzzwords: no "revolutionary," "cutting-edge," "leverage AI"
7. No competitor names in cold emails
8. Subject lines: max 50 characters, no ALL CAPS, no spam triggers
9. Tone: peer-to-peer, professional, GovCon language
10. Always include unsubscribe link

## Template Selection by Tag
- manual_workaround: Lead with time savings, midnight spreadsheet grind
- direct_competitor: Lead with cost gap, their tool doesn't auto-generate matrices
- indirect_tool: Lead with output format gap, ChatGPT can't produce formatted Excel
- status_quo: Lead with risk of disqualification, cost of missed requirements

## Personalization Rules
- Use ONLY facts from prospect data (never invent details)
- Maximum 2 personalization touches per email
- BEST: recent specific event. GOOD: role-specific empathy. AVOID: generic industry reference
STAGE1EOF

echo "  ✓ .agents/email-writer.md"

# ────────────────────────────────────────
# .agents/research-agent.md
# ────────────────────────────────────────
cat > .agents/research-agent.md << 'STAGE1EOF'
# Agent: Research Agent
# Path: .agents/research-agent.md
# Purpose: Market research, competitor monitoring, and intelligence gathering
# Model: Gemini 2.5 Pro (grounded web research) / Claude Sonnet (analysis)
# Autonomy: Tier 1 (research) / Tier 2 (weekly reports)

## Role
You continuously monitor the competitive landscape, track market signals,
identify emerging alternatives, and surface actionable intelligence.

## Core Workflows
1. Competitor Monitoring (Weekly): Track direct competitors (Deltek, Privia, PMAPS),
   indirect competitors (ChatGPT, templates), manual workaround patterns
   (new Excel templates shared in communities), and status quo signals
   (bid protest disqualifications).
2. Prospect Intelligence (Ongoing): Feed outreach-agent with SAM.gov awards,
   LinkedIn activity, job postings, and community discussions.
3. Content Ideas (Bi-weekly): Propose content topics based on research findings.

## Safety Boundaries
- Never scrape in violation of robots.txt or ToS
- Never store prospect PII beyond what's needed for scoring
- Never contact prospects directly (all outreach through outreach-agent)
- Always cite sources, flag uncertainty as [UNCONFIRMED]
STAGE1EOF

echo "  ✓ .agents/research-agent.md"

# ────────────────────────────────────────
# .agents/support-agent.md
# ────────────────────────────────────────
cat > .agents/support-agent.md << 'STAGE1EOF'
# Agent: Support Agent
# Path: .agents/support-agent.md
# Purpose: Customer support triage, common issue resolution, escalation
# Model: Claude Haiku (fast triage) / Claude Sonnet (complex issues)
# Autonomy: Tier 1 (classification) / Tier 2 (known fixes) / Tier 3 (responses)
# Note: Month 1-3, founder handles support directly. This agent assists by
#       drafting responses for founder review.

## Support Categories
1. Account Issues (Tier 2 auto-resolve): password reset, login, billing
2. Product Issues - Known (Tier 2): file too large, unsupported type, timeout
3. Product Issues - Unknown (Tier 3): accuracy complaints, formatting issues
4. Security Questions (Tier 3 ALWAYS): data handling, SOC 2, CUI, compliance
5. Feature Requests (Tier 1): log and acknowledge
6. Positive Feedback (Tier 1): log, thank, ask for testimonial

## Response Principles
- Fast acknowledgment: respond within 2 hours during business hours
- Empathy first: GovCon work is stressful, acknowledge the pressure
- Specific and actionable: not "try again" but "re-upload; if error X persists, send file name"
- Honest about limitations: if we can't do something yet, say so with timeline
- Churn prevention: frustration or cancellation mention -> escalate to founder

## Escalation: Always escalate accuracy complaints, security questions,
## enterprise inquiries, churn signals, and hostile messages.
STAGE1EOF

echo "  ✓ .agents/support-agent.md"

# ────────────────────────────────────────
# .agents/sentinel-agent.md
# ────────────────────────────────────────
cat > .agents/sentinel-agent.md << 'STAGE1EOF'
# Agent: Sentinel Agent
# Path: .agents/sentinel-agent.md
# Purpose: System monitoring, KPI tracking, anomaly detection, safety enforcement
# Model: Gemini Flash (high-frequency monitoring) / Claude Sonnet (analysis)
# Autonomy: Tier 1 (monitoring/logging) / Tier 2 (alerts) / Tier 3 (recommendations)

## Monitoring Domains
1. System Health (Continuous): error rates, latency, uptime, API response times
2. Business KPIs (Daily): signups, shreds, MRR, churn, conversion
3. Revenue Forecast (Monthly): compare actuals to baseline, flag >20% variance
4. Safety Enforcement (Continuous): monitor all agent actions for boundary compliance
5. Cost Monitoring (Daily): API spend, infrastructure costs, margin tracking

## Alert Thresholds
- Error rate > 5% for 15 min -> Tier 2 notification
- Error rate > 20% for 5 min -> Tier 2 + auto-pause new shreds
- Service unreachable 2+ min -> Tier 2 notification
- Daily API spend > $50 -> Tier 2 alert
- Monthly cost > 15% of MRR -> Tier 2 alert
- Any safety boundary violated -> Tier 2 alert, block action

## Emergency Stop Protocol
Auto-triggers: 10+ unsubscribes/day, spam complaint, fraud dispute,
50%+ error rate for 5 min, Tier 4 action attempted.
Actions: pause all agents, cancel queued emails, set all to Tier 4, notify founder.

## Daily Digest
Generated at 08:00 ET. Includes: KPIs, health status, agent activity,
pending approvals, alerts. Target: founder reads in 10 minutes.
STAGE1EOF

echo "  ✓ .agents/sentinel-agent.md"

# ────────────────────────────────────────
# .claude/claude.md
# ────────────────────────────────────────
cat > .claude/claude.md << 'STAGE1EOF'
# Claude Code — Master Context
# Path: .claude/claude.md
# Purpose: Primary context file that Claude Code reads before any task

## You Are Building: RFP Shredder
An AI-powered compliance matrix generator for government contractors.
Upload an RFP (PDF/DOCX) -> formatted Excel compliance matrix in 2 minutes.

## Critical Context — Read These First
1. /claude.md (root) — Full Stage 2 build brief
2. /qa/QA-STRATEGY.md — Testing philosophy and protocols
3. /qa/test-specs/[component].md — Test spec for what you're building
4. /docs/architecture/system-overview.md — System architecture
5. /docs/architecture/security-model.md — Zero-retention security model

## Non-Negotiable Rules
1. ZERO DOCUMENT RETENTION. Never store uploaded content anywhere persistent.
2. TEST BEFORE DONE. Every component passes its test spec before moving on.
3. FREE TIER FIRST. Only paid service: Vercel Pro ($20/mo).
4. SELF-CORRECT BEFORE ESCALATING. Max 3 fix attempts, then escalate.
5. SCOPE LOCKS ARE PERMANENT. MVP = L/M extraction only. No ghost reqs, no amendments.

## Reference Files
- Coding standards: .claude/rules/coding-standards.md
- Security rules: .claude/rules/security-rules.md
- Output standards: .claude/rules/output-standards.md
- Autonomy boundaries: .claude/rules/autonomy-boundaries.md
- API development: .claude/skills/api-development.md
- Landing page: .claude/skills/landing-page.md
- Email automation: .claude/skills/email-automation.md
- Data analysis: .claude/skills/data-analysis.md
STAGE1EOF

echo "  ✓ .claude/claude.md"

# ────────────────────────────────────────
# .claude/rules/coding-standards.md
# ────────────────────────────────────────
cat > .claude/rules/coding-standards.md << 'STAGE1EOF'
# Coding Standards
# Path: .claude/rules/coding-standards.md

## Language and Framework
- TypeScript strict mode for all Node.js code (no any types)
- Python 3.11+ for PDF parsing serverless function only
- Next.js 14 with App Router (not Pages Router)
- React Server Components by default; Client Components only for interactivity
- Tailwind CSS for styling

## File Structure
- Every file starts with comment header: path, purpose, dependencies, test spec
- One export per file where practical. Named exports, not default.
- Max 200 lines per file; split if larger.

## Naming
- Files: kebab-case (rate-limit.ts)
- Functions: camelCase (parseDocument)
- Types: PascalCase (Requirement)
- Constants: SCREAMING_SNAKE_CASE (MAX_FILE_SIZE_MB)
- Env vars: SCREAMING_SNAKE_CASE with prefix (SUPABASE_URL)
- DB tables: snake_case (shred_log)
- API routes: kebab-case URLs (/api/billing/checkout)

## TypeScript Rules
- strict: true in tsconfig. Define types for all params and returns.
- Zod for runtime validation of external inputs.
- Discriminated unions for state management.
- No as assertions unless commented why.

## Error Handling
- Every async function in try/catch
- Custom error classes for domain errors
- API routes return: { error: { message, code } }
- Never expose stack traces to users

## Database
- ALL queries through Supabase client (never raw SQL)
- ALL tables have Row Level Security
- ALL user queries filter by authenticated user ID
- Service role ONLY in webhooks and background jobs
- UUIDs for all primary keys, timestamptz for dates

## API Route Pattern
1. Validate request (Zod)  2. Authenticate (JWT)  3. Authorize (subscription/rate limit)
4. Execute logic  5. Return response  6. Handle errors

## Dependencies
- Minimize. Pin exact versions. Document why each was chosen.
STAGE1EOF

echo "  ✓ .claude/rules/coding-standards.md"

# ────────────────────────────────────────
# .claude/rules/security-rules.md
# ────────────────────────────────────────
cat > .claude/rules/security-rules.md << 'STAGE1EOF'
# Security Rules
# Path: .claude/rules/security-rules.md
# Priority: These override convenience. Secure approach always wins.

## Rule 1: Zero Document Retention (ABSOLUTE)
- NEVER write document content to Supabase, S3, or any persistent store
- NEVER log document content, requirement text, or file names
- NEVER include document content in error messages
- NEVER cache document content in Redis or session storage
- Content exists ONLY in: /tmp (auto-purged), in-memory variables, Claude API transit
- After Excel generation, explicitly null all document variables

## Rule 2: Input Validation
- Validate ALL inputs with Zod. File uploads: validate MIME, extension, AND magic bytes.
- Allowed: PDF, DOCX only. Max 50MB. Reject everything else.

## Rule 3: Authentication
- Every protected route validates JWT via Supabase Auth
- Invalid/expired/missing JWT -> 401 generic message
- Rate limit login: 5 per IP per 15 minutes

## Rule 4: Authorization
- RLS on ALL tables. Service role ONLY in webhooks.

## Rule 5: Secrets
- ALL secrets in env vars. .env.local gitignored. .env.example has placeholders.
- Server-only keys: SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY
- NEVER prefix server keys with NEXT_PUBLIC_

## Rule 6: HTTP Security Headers
Strict-Transport-Security, X-Content-Type-Options: nosniff, X-Frame-Options: DENY,
X-XSS-Protection, Referrer-Policy, Permissions-Policy, Content-Security-Policy

## Rule 7: Stripe — verify webhook signatures, never trust client-side price data
## Rule 8: Rate Limiting — /api/shred: 10/user/hr, login: 5/IP/15min, signup: 3/IP/hr
## Rule 9: CORS — own domain only in production
## Rule 10: Dependencies — npm audit before deploy, pin versions
STAGE1EOF

echo "  ✓ .claude/rules/security-rules.md"

# ────────────────────────────────────────
# .claude/rules/output-standards.md (condensed — full spec in Batch 7)
# ────────────────────────────────────────
cat > .claude/rules/output-standards.md << 'STAGE1EOF'
# Output Standards
# Path: .claude/rules/output-standards.md

## Excel Compliance Matrix Columns (in order)
1. Req ID (L-001, M-001)  2. RFP Section (L.4.3.2)  3. Page  4. Requirement Text
5. Obligation Level (Shall/Must/Should/May/Will/Is Required To/Is Expected To)
6. Eval Factor Mapping (M.2.1 — Technical Approach)
7. Response Strategy (blank)  8. Compliance Status (dropdown: Compliant/Partial/Non-Compliant/N/A)

## Formatting
- Header: bold, #1B365D background, white text, frozen row
- Obligation colors: Shall/Must = red #FFE0E0, Should = yellow #FFF3CD, May = green #D4EDDA
- Alternating rows: white / #F8F9FA. Auto-filter on header. Wrap text on Requirement column.
- Sheet 1: Compliance Matrix. Sheet 2: L-M Cross Reference (if applicable).
- Metadata footer: "Generated by RFP Shredder | [Date] | [Pages] | [Requirements]"
- Disclaimer: "AI-generated. Always verify against the original RFP."

## UI Text: Use GovCon terminology. Errors must be specific and actionable.
## Landing Page: benefit-first headlines, no buzzwords, quantify everything.
## Email: max 50 char subjects, 4-6 sentences cold, peer-to-peer tone.
STAGE1EOF

echo "  ✓ .claude/rules/output-standards.md"

# ────────────────────────────────────────
# .claude/rules/autonomy-boundaries.md (condensed)
# ────────────────────────────────────────
cat > .claude/rules/autonomy-boundaries.md << 'STAGE1EOF'
# Autonomy Boundaries
# Path: .claude/rules/autonomy-boundaries.md

## Tier 1 — Fully Autonomous: research, scoring, tagging, drafting, monitoring, logging
## Tier 2 — Auto with Notification: follow-ups to engaged prospects, transactional emails, subject line rotation, daily digests
## Tier 3 — Recommend and Wait: first-touch emails, prospect replies, landing page changes, pricing suggestions, content publication, forecast revisions
## Tier 4 — Human Only: financial transactions, pricing changes, legal, data deletion, credentials, deployments, schema changes, disabling safety

## Earned Autonomy: Weeks 1-2 maximum oversight. Weeks 3-4 trust building (90%+ approval -> restore Tier 2). Month 2 expanded. Month 3+ full ops (~25 min/day founder).
## Revocation: customer complaint, spam, security violation, rate limit exceeded -> immediate return to max oversight.
STAGE1EOF

echo "  ✓ .claude/rules/autonomy-boundaries.md"

# ────────────────────────────────────────
# .claude/skills/ (4 files, condensed)
# ────────────────────────────────────────
cat > .claude/skills/api-development.md << 'STAGE1EOF'
# Skill: API Development — Path: .claude/skills/api-development.md
# Every API route: 1. Validate (Zod) 2. Auth (JWT) 3. Authorize 4. Execute 5. Respond 6. Error handle
# /api/shred is the most complex endpoint: file reception -> validate -> parse -> chunk -> extract -> crossref -> excel -> respond
# Must complete within 300s Vercel timeout. Stream progress if possible.
# Error codes: VALIDATION_ERROR (400), AUTH_REQUIRED (401), SUBSCRIPTION_REQUIRED (403), TRIAL_EXHAUSTED (403),
# RATE_LIMITED (429), FILE_TOO_LARGE (400), UNSUPPORTED_FILE_TYPE (400), PAGE_LIMIT_EXCEEDED (400),
# PROCESSING_FAILED (500), PROCESSING_TIMEOUT (504), SECTIONS_NOT_FOUND (422), EXTERNAL_API_ERROR (502)
STAGE1EOF

cat > .claude/skills/landing-page.md << 'STAGE1EOF'
# Skill: Landing Page — Path: .claude/skills/landing-page.md
# 10 sections: 1.Hero 2.Pain Statement 3.How It Works 4.Comparison(manual vs shredder)
# 5.Security 6.Pricing 7.Social Proof 8.FAQ 9.Final CTA 10.Footer
# Hero: "Your compliance matrix. Done in 2 minutes." + CTA "Shred Your First RFP Free"
# Pain: "Still building compliance matrices by hand?" + specific pain points
# Comparison table: manual (12-20hrs, $900-$2400, fatigue-dependent) vs Shredder (2min, $99/mo, consistent)
# Security in first scroll: "Your data never leaves your session"
# Pricing: Free Trial ($0, 1 shred), Solo ($99/mo unlimited), Team (coming soon), Enterprise (contact)
# Design: professional not flashy. Dark hero, white content, dark CTA. Navy #1B365D, green #10B981. Inter font.
# Mobile-first. No stock photos. Lighthouse: Perf 80+, A11y 90+, SEO 80+, BP 80+.
STAGE1EOF

cat > .claude/skills/email-automation.md << 'STAGE1EOF'
# Skill: Email Automation — Path: .claude/skills/email-automation.md
# Provider: Resend. Simple HTML templates (inline styles, no images, max-width 600px).
# Triggers: signup->welcome, trial shred->completion stats, 24hr no sub->nudge,
# stripe sub->confirmation, cancel->cancellation, payment fail->alert
# Centralized sender: src/lib/email/send.ts. Retry once on failure. Don't block user flow.
# Colors: header #1B365D, CTA button #10B981. Keep emails 2-4 short paragraphs.
STAGE1EOF

cat > .claude/skills/data-analysis.md << 'STAGE1EOF'
# Skill: Data Analysis — Path: .claude/skills/data-analysis.md
# Track: signups, shreds (trial vs paid), MRR, churn, conversion, ARPU, error rate
# DO NOT track: document content, requirement text, file names, specific RFP agencies
# Daily digest queries: signups today, shreds today, MRR, churn, error rate
# Monthly: compare actuals to docs/REVENUE-FORECAST.md. Flag >20% variance.
# Infrastructure costs: target total < 15% of MRR. Alert if exceeded.
STAGE1EOF

echo "  ✓ .claude/skills/ (4 files)"

# ────────────────────────────────────────
# docs/README.md
# ────────────────────────────────────────
cat > docs/README.md << 'STAGE1EOF'
# RFP Shredder
AI-powered compliance matrix generator for government contractors.
Upload RFP -> 2-minute formatted Excel compliance matrix.
Target: Proposal Managers at $5M-$100M GovCon firms. Price: $99/month Solo.

## Tech Stack
Next.js 14, Vercel Pro, Supabase, Claude Sonnet API, pdfplumber, ExcelJS, Stripe, Resend, Tailwind

## Key Documents
- Build brief: claude.md (root)
- Architecture: docs/architecture/system-overview.md
- Security: docs/architecture/security-model.md
- QA: qa/QA-STRATEGY.md
- Launch: docs/LAUNCH-CHECKLIST.md
- Growth: docs/GROWTH-PLAYBOOK.md
- Revenue: docs/REVENUE-FORECAST.md
- Competitive: docs/COMPETITIVE-POSITIONING.md
STAGE1EOF

echo "  ✓ docs/README.md"

# ────────────────────────────────────────
# api/README.md
# ────────────────────────────────────────
cat > api/README.md << 'STAGE1EOF'
# Python Serverless Functions
# Path: api/README.md
# PDF parser uses pdfplumber (Python) for best extraction quality.
# Vercel auto-deploys Python files in api/ as serverless functions.
# Endpoint: POST /api/parse-pdf
# Requirements: pdfplumber>=0.10.0, python-multipart>=0.0.6
# vercel.json must set runtime: python3.11, maxDuration: 300
STAGE1EOF

echo "  ✓ api/README.md"

# ────────────────────────────────────────
# .env.example
# ────────────────────────────────────────
cat > .env.example << 'STAGE1EOF'
# RFP Shredder — Environment Variables
# Copy to .env.local for development. NEVER commit .env.local.

# SUPABASE (Day 1)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# STRIPE (Day 5)
STRIPE_SECRET_KEY=sk_test_your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
STRIPE_PRICE_SOLO_MONTHLY=price_your-price-id

# ANTHROPIC (Day 3)
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# RESEND (Day 6)
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=hello@yourdomain.com

# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=RFP Shredder

# FEATURE FLAGS
FEATURE_DOCX_SUPPORT=false
FEATURE_OCR_SUPPORT=false
FEATURE_GHOST_REQUIREMENTS=false

# UPGRADE NOTES (not env vars — reference only)
# $500 MRR: Supabase Pro ($25), Sentry, Plausible
# $2000 MRR: Upstash Redis, enhanced monitoring
STAGE1EOF

echo "  ✓ .env.example"

# ────────────────────────────────────────
# antigravity.config.yaml
# ────────────────────────────────────────
cat > antigravity.config.yaml << 'STAGE1EOF'
project:
  name: rfp-shredder
  description: AI-powered compliance matrix generator for government contractors
  version: 0.1.0
build:
  brief: claude.md
  stage1_outputs: [docs/, qa/, .agents/, .claude/, prompts/, outreach/, autonomous/, workflows/]
  stage2_outputs: [src/, api/, scripts/, qa/tests/, qa/screenshots/, qa/lighthouse/]
runtime:
  framework: nextjs
  node_version: "20"
  python_version: "3.11"
  package_manager: npm
  test_runner: vitest
  e2e_runner: playwright
quality:
  lighthouse: {performance: 80, accessibility: 90, seo: 80, best_practices: 80}
  coverage: {unit: 80, security_critical: 100}
  extraction: {recall: 95, precision: 90, obligation_accuracy: 95, crossref_accuracy: 85}
tracking:
  progress_file: PROGRESS.md
  lessons_file: LESSONS.md
  test_results: qa/TEST-RESULTS.md
STAGE1EOF

echo "  ✓ antigravity.config.yaml"

# ────────────────────────────────────────
# claude.md (ROOT — Stage 2 Build Brief)
# ────────────────────────────────────────
cat > claude.md << 'STAGE1EOF'
# RFP Shredder — Stage 2 Build Brief
# Path: claude.md (project root)
# This file IS the build plan. Read completely before writing any code.

## PROJECT OVERVIEW
Build RFP Shredder: upload federal RFP (PDF/DOCX) -> formatted Excel compliance
matrix with every Section L/M requirement extracted, classified, cross-referenced.
Target: Proposal Managers at $5M-$100M GovCon firms. Price: $99/mo Solo.
Core value: 12-20 hours -> 2 minutes.

## CRITICAL CONSTRAINTS
1. ZERO DOCUMENT RETENTION. Documents in ephemeral /tmp only. NEVER persist content.
2. FREE TIER FIRST. Only paid: Vercel Pro ($20/mo). Everything else free tier.
3. SCOPE LOCKS: MVP = L/M extraction + obligation classification + cross-ref + Excel.
   Ghost requirements deferred to v1.5. Amendments deferred to v2.
   Day 7 = beta (10 testers, digital PDFs). Day 14 = public launch.

## TECH STACK
Next.js 14 (App Router, TS), Vercel Pro, Supabase free, Stripe, Claude Sonnet API,
pdfplumber (Python), mammoth.js, ExcelJS, Resend free, Tailwind, Zod, Vitest, Playwright

## BUILD SEQUENCE
Phase 1 (Day 1): Foundation — auth, DB schema, middleware. Test: qa/test-specs/auth.md
Phase 2 (Day 2): PDF/DOCX parsing. Test: qa/test-specs/core-product.md
Phase 3 (Day 3): Extraction engine (chunking + Claude API). Test: qa/test-specs/core-product.md
Phase 4 (Day 4): Cross-reference + Excel generation. Test: qa/test-specs/core-product.md
Phase 5 (Day 5): Billing (Stripe). Test: qa/test-specs/billing.md
Phase 6 (Day 6): Landing page + email. Test: qa/test-specs/landing-page.md + email-system.md
Phase 7 (Day 7): Security hardening + integration. Test: qa/test-specs/full-integration.md

## BUILD-VERIFY-LEARN LOOP
For every component: READ test spec -> BUILD -> TEST -> FIX (max 3) -> REVIEW -> LOG -> MOVE ON
Install testing tools first:
  npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
  npx playwright install chromium
  npm install -g lighthouse

## COMPETITIVE CONTEXT
Primary competition: manual process (12-20 hrs in Word+Excel).
Landing page must include comparison section. See .claude/skills/landing-page.md.

## REVENUE TARGETS
Month 3: $2,000 MRR. Month 6: $6,500 MRR. Month 12: $14,820 MRR.
Infrastructure alerts: $500 MRR -> Tier 2. $2,000 MRR -> Tier 3.

## DEMO-READY GATE (all must pass)
1. All unit tests pass  2. All integration tests pass  3. All E2E tests pass
4. Lighthouse meets minimums  5. Security headers verified  6. No console errors
7. Visual verification at 3 viewports  8. 95%+ recall on test corpus
9. Error states handled gracefully  10. Landing page < 3s on Fast 3G

## REFERENCE FILES
Read all files in .claude/, docs/, qa/ before starting each phase.
STAGE1EOF

echo "  ✓ claude.md (build brief)"

# ────────────────────────────────────────
# docs/LAUNCH-CHECKLIST.md
# ────────────────────────────────────────
cat > docs/LAUNCH-CHECKLIST.md << 'STAGE1EOF'
# RFP Shredder — Launch Checklist

## Day 0: Setup
- [ ] Register domain (~$12/yr)
- [ ] Vercel account + Pro ($20/mo)
- [ ] Supabase project (free)
- [ ] Stripe account + Solo product ($99/mo recurring)
- [ ] Anthropic API account
- [ ] Resend account (free)
- [ ] GitHub repo
- [ ] Run stage1-setup.sh
- [ ] Configure env vars in Vercel

## Days 1-7: Build (Claude Code follows claude.md)
- [ ] Day 1: Auth + DB (test: auth.md)
- [ ] Day 2: PDF parser (test: core-product.md)
- [ ] Day 3: Extraction engine (test: core-product.md)
- [ ] Day 4: Cross-ref + Excel (test: core-product.md)
- [ ] Day 5: Billing (test: billing.md)
- [ ] Day 6: Landing + email (test: landing-page.md)
- [ ] Day 7: Security + BETA LAUNCH to 10 testers

## Days 7-8: Acquisition Channel Validation
- [ ] Confirm LinkedIn/SAM.gov accessible
- [ ] Identify 20+ prospects with intent signals
- [ ] Confirm direct contact path to prospects
- [ ] Test 2-3 outreaches to validate response time
- [ ] Tag each prospect with Current Alternative
- [ ] If any fail: pause, revisit Acid Test

## Days 7-14: Beta
- [ ] 10 DMs/day to qualified prospects
- [ ] 95%+ recall confirmed on real RFPs
- [ ] 3+ beta accuracy reviews collected
- [ ] 1-2 testimonials (even informal)

## Day 14: Public Launch
- [ ] Post in APMP LinkedIn Group
- [ ] Post in r/GovCon
- [ ] Begin daily outreach rhythm

## Cost Milestones
Day 1-7: ~$52 | First customer: +$0 | $500 MRR: eval Tier 2 | $2K MRR: eval Tier 3
STAGE1EOF

echo "  ✓ docs/LAUNCH-CHECKLIST.md"

# ────────────────────────────────────────
# docs/GROWTH-PLAYBOOK.md
# ────────────────────────────────────────
cat > docs/GROWTH-PLAYBOOK.md << 'STAGE1EOF'
# RFP Shredder — Growth Playbook

## 30-Day Review
- Buyer Receptivity Review: response rate, conversion rate, best intent signals
- Revenue Forecast Reconciliation: actual vs baseline, update assumptions
- If response < 10% AND conversion < 5%: PAUSE, re-evaluate channel/persona
- Actions: double down on best channel, fix top accuracy complaint, 2 LinkedIn articles

## 60-Day Review
- Competitive Position Review: are alternatives still accurate? Which triggers converted?
- Update docs/COMPETITIVE-POSITIONING.md
- Actions: launch v1.5 if 10+ customers, scale outreach agents, build case studies

## 90-Day Review
- Revenue Forecast Reconciliation: actual vs all scenarios
- If below Conservative at 90 days: trigger strategic review
- Actions: launch v2 if healthy, enable full autonomous ops, begin SOC 2 if $5K MRR

## Growth Levers
Month 1-2: Manual outreach (LinkedIn DMs, cold email, APMP). Cost: $0.
Month 3-4: Agent-assisted outreach with founder approval. Cost: $0.
Month 4-6: Partnerships (consultants, APMP sponsorships). Cost: $500-$1K/mo.
Month 6+: Organic (SEO content, word-of-mouth, referrals). Cost: $200-$500/mo.
STAGE1EOF

echo "  ✓ docs/GROWTH-PLAYBOOK.md"

# ────────────────────────────────────────
# docs/OPERATIONS-GUIDE.md
# ────────────────────────────────────────
cat > docs/OPERATIONS-GUIDE.md << 'STAGE1EOF'
# RFP Shredder — Operations Guide

## Daily Routine (Month 2+, ~25 min)
08:00 Morning digest review (10 min): KPIs, alerts, anomalies
08:10 Approval queue (10 min): approve/edit/reject emails, reply to prospects
08:20 Quick actions (5 min): handle urgent items
17:00 Evening check (5 min, optional): prospect replies, alerts

## Weekly: Monday planning (30 min), Friday content (30 min)
## Monthly: Forecast reconciliation, competitive review, agent review, cost review

## Emergency Procedures
Product down: Check Vercel -> Supabase -> Anthropic status. Communicate to users.
Security concern: Respond within 2 hours with specific architecture details.
Accuracy complaint: Respond 2 hrs, investigate, fix, add to test corpus.
Spam complaint: Emergency stop all outreach, investigate, fix before resuming.

## Healthy Metrics
Error rate <1%, shred time <120s, uptime >99%, signups 1+/day, churn <5%
STAGE1EOF

echo "  ✓ docs/OPERATIONS-GUIDE.md"

# ────────────────────────────────────────
# PROGRESS.md and LESSONS.md
# ────────────────────────────────────────
cat > PROGRESS.md << 'STAGE1EOF'
# RFP Shredder — Build Progress
# Updated by Claude Code after each build phase
## Status: Stage 2 Not Started
STAGE1EOF

cat > LESSONS.md << 'STAGE1EOF'
# RFP Shredder — Lessons Learned
# Updated by Claude Code after every fix. Read before starting each new component.
STAGE1EOF

echo "  ✓ PROGRESS.md, LESSONS.md"

# ────────────────────────────────────────
# PROMPT FILES (8 files)
# These are reference documents that Claude Code reads when building agents.
# Full prompt text was delivered in Batches 8-9 of the Stage 1 session.
# ────────────────────────────────────────

cat > prompts/research/prospect-finder.md << 'STAGE1EOF'
# Prompt: Prospect Finder
# Model: Claude Sonnet | Used by: outreach-agent | Tier: 1
# Scores prospects: Reachability (1-5), Intent Signal (1-5), Decision Speed (1-5)
# Gate: 4+ on all three = active_outreach, else nurture_list
# Tags: direct_competitor, indirect_tool, manual_workaround (default), status_quo
# Target: Proposal Managers at $5M-$100M GovCon firms, 5+ RFPs/quarter
# Output: JSON array of scored, tagged prospect records with personalization hooks
# Scoring rubric:
#   Reachability 5: direct email + LinkedIn + community member
#   Intent 5: posted about pain in last 30 days AND recent contract win
#   Decision Speed 5: Proposal Manager title (direct budget authority)
# See Stage 1 Batch 8 for complete system prompt, user prompt template, and example output
STAGE1EOF

cat > prompts/research/competitor-monitor.md << 'STAGE1EOF'
# Prompt: Competitor Monitor
# Model: Claude Sonnet | Used by: research-agent | Tier: 1/2
# Monitors 4 categories: direct (Deltek/Privia/PMAPS), indirect (ChatGPT/templates),
# manual workarounds (new Excel templates in communities), status quo (bid protests)
# Flags changes: Impact (High/Med/Low), Response Recommended, Urgency
# Output: weekly competitive landscape update with matrix update recommendations
# See Stage 1 Batch 8 for complete system prompt and output format
STAGE1EOF

cat > prompts/outreach/cold-email-generator.md << 'STAGE1EOF'
# Prompt: Cold Email Generator
# Model: Gemini Flash | Used by: email-writer | Tier: 1 (draft) / 3 (send)
# 4 variants by current_alternative tag:
#   manual_workaround: "12 hours -> 2 minutes" (time savings)
#   direct_competitor: "your tool doesn't auto-generate the matrix" (feature gap)
#   indirect_tool: "ChatGPT can't output formatted Excel with cross-refs" (output gap)
#   status_quo: "one missed shall = disqualified" (risk)
# Rules: max 6 sentences, pain-first, one quantified claim, security statement, one CTA
# Subject lines max 50 chars. Peer-to-peer tone. No buzzwords. No competitor names.
# See Stage 1 Batch 8 for complete prompt text and subject line variants
STAGE1EOF

cat > prompts/outreach/follow-up-generator.md << 'STAGE1EOF'
# Prompt: Follow-Up Generator
# Model: Gemini Flash | Used by: email-writer | Tier: 2
# Max 3 follow-ups. Each adds NEW value (content piece, stat, use case).
# FU1 (48+ hrs): 3-4 sentences, new angle. FU2 (48+ hrs): 2-3 sentences, check-in.
# FU3 (1 week): 2 sentences, gentle close. After FU3 -> nurture list.
# Never "just following up." Never guilt-trip. Never fake urgency.
# See Stage 1 Batch 8 for complete prompt and content angle rotation
STAGE1EOF

cat > prompts/outreach/personalization-engine.md << 'STAGE1EOF'
# Prompt: Personalization Engine
# Model: Claude Haiku | Used by: email-writer | Tier: 1
# Enriches templates with prospect-specific details. Max 2 touches per email.
# Hierarchy: recent event > role empathy > company context > generic (avoid)
# Use ONLY facts from prospect data. Never invent. Never reference private info.
# Flags quality: high/medium/low. Low -> flagged in approval queue.
# See Stage 1 Batch 9 for complete prompt text
STAGE1EOF

cat > prompts/product/feature-builder.md << 'STAGE1EOF'
# Prompt: Feature Builder
# Model: Claude Sonnet/Opus | Used by: product-builder | Tier: 3
# Process: 1.Understand 2.Architecture Check 3.Write Test Spec FIRST
# 4.Build 5.Verify 6.Document
# Constraints: zero retention, free tier first, scope locks, security rules
# Run existing tests BEFORE starting. Run ALL tests AFTER building.
# See Stage 1 Batch 9 for complete prompt text
STAGE1EOF

cat > prompts/product/bug-fixer.md << 'STAGE1EOF'
# Prompt: Bug Fixer
# Model: Claude Sonnet/Opus | Used by: product-builder | Tier: 1-3
# Process: 1.Reproduce 2.Diagnose (root cause, not symptom) 3.Assess Impact
# 4.Fix 5.Test (full suite) 6.Prevent (LESSONS.md) 7.Communicate
# Max 3 attempts. For accuracy bugs: test against FULL corpus, not just trigger RFP.
# See Stage 1 Batch 9 for complete prompt text
STAGE1EOF

cat > prompts/operations/daily-report.md << 'STAGE1EOF'
# Prompt: Daily Report
# Model: Claude Haiku | Used by: sentinel-agent | Tier: 2
# Under 300 words. Lead with what changed. Flag anomalies. Celebrate wins.
# Include: MRR, subscribers, shreds, signups, health status, agent activity.
# Recommend one action for the day.
# See Stage 1 Batch 9 for complete prompt and output format
STAGE1EOF

cat > prompts/operations/metrics-analyzer.md << 'STAGE1EOF'
# Prompt: Metrics Analyzer
# Model: Claude Sonnet | Used by: sentinel-agent | Tier: 2/3
# Monthly: compare actuals to forecast, identify trends, recommend actions.
# Red flags: flat MRR 3+ weeks, churn >7% 2+ months, conversion <15%,
# shreds/user <2, CAC increasing. Connect to competitive positioning.
# See Stage 1 Batch 9 for complete prompt and output format
STAGE1EOF

echo "  ✓ prompts/ (8 files)"

# ────────────────────────────────────────
# OUTREACH FILES (15 files)
# Full email text was delivered in Batches 10-11 of Stage 1 session.
# ────────────────────────────────────────

cat > outreach/email-sequences/welcome-sequence.md << 'STAGE1EOF'
# Welcome Sequence | Trigger: signup | 1 email immediate
# Subject: Your compliance matrix is waiting
# Body: Welcome + 3-step how-to (upload, shred, download) + security note
# + "try it on a live bid" + reply comes to founder
# CTA: link to dashboard. Plain text style. Unsubscribe footer.
# See Stage 1 Batch 10 for complete email text
STAGE1EOF

cat > outreach/email-sequences/trial-completion-sequence.md << 'STAGE1EOF'
# Trial Completion | Trigger: free shred done | 2 emails
# Email 1 (30s after shred): "{requirement_count} requirements found"
#   Dynamic stats: requirement_count, shall_count, should_count, cross_ref_count, time
#   estimated_hours_saved = requirement_count * 8 min / 60
#   CTA: Subscribe $99/month
# Email 2 (24hr, if not subscribed): "Still checking the matrix?"
#   Addresses accuracy concern + ROI ($99 < 1hr PM time). Soft CTA.
# See Stage 1 Batch 10 for complete email text
STAGE1EOF

cat > outreach/email-sequences/nurture-sequence.md << 'STAGE1EOF'
# Nurture Sequence | For non-ready prospects | 4 emails bi-weekly
# Email 1: "5 ghost requirements that kill proposals" (content link, zero selling)
# Email 2: "What 50 RFPs taught us" (data-driven, soft trial CTA)
# Email 3: Case study with specific numbers (when available)
# Email 4: "Still building matrices by hand?" (re-engagement, last email)
# After Email 4: prospect goes to inactive list
# See Stage 1 Batch 10 for complete email text
STAGE1EOF

cat > outreach/email-sequences/onboarding-sequence.md << 'STAGE1EOF'
# Onboarding | Trigger: subscription | 3 emails
# Email 1 (immediate): Confirmation + tips (upload full RFP, formats, security)
# Email 2 (Day 3): Power user tips (shred early, eval factor mapping, re-shred amendments)
# Email 3 (Day 7): Feedback request + referral mention (critical retention checkpoint)
# See Stage 1 Batch 10 for complete email text
STAGE1EOF

cat > outreach/cold-outreach/manual-workaround.md << 'STAGE1EOF'
# Cold Outreach: Manual Workaround Prospects (~70%)
# Tag: manual_workaround | Switching trigger: 3+ concurrent proposals
# First touch: lead with time (12hrs->2min), personalization hook, security, free trial CTA
# Subject variants: "Your next compliance matrix - 2 minutes" / "12 hours of copy-paste -> 2 min"
# FU1: ghost requirements content piece. FU2: quick check-in. FU3: gentle close.
# See Stage 1 Batch 10 for complete templates
STAGE1EOF

cat > outreach/cold-outreach/direct-competitor.md << 'STAGE1EOF'
# Cold Outreach: Direct Competitor Prospects (~10%)
# Tag: direct_competitor | Never mention competitor names
# Lead with: "Does your current tool actually BUILD the matrix, or do you still do that manually?"
# Position as complement ($99/mo vs $25K+/yr for just the matrix step)
# See Stage 1 Batch 10 for complete templates
STAGE1EOF

cat > outreach/cold-outreach/indirect-tool.md << 'STAGE1EOF'
# Cold Outreach: Indirect Tool Prospects (~15%)
# Tag: indirect_tool | Acknowledge AI sophistication
# Lead with: generic AI gives wall of text, not formatted Excel with cross-refs
# "It's what AI would be if it understood federal RFP structure"
# See Stage 1 Batch 10 for complete templates
STAGE1EOF

cat > outreach/cold-outreach/status-quo.md << 'STAGE1EOF'
# Cold Outreach: Status Quo Prospects (~5%)
# Tag: status_quo | Hardest to convert, highest personalization needed
# Lead with: risk, disqualification stories, cost of inaction
# "127 mandatory requirements avg, 23% outside L and M. Missing one = disqualified."
# Lower volume. Position as safety net/insurance.
# See Stage 1 Batch 10 for complete templates
STAGE1EOF

cat > outreach/reply-templates/interested.md << 'STAGE1EOF'
# Reply: Interested | Tier 3 (founder reviews all)
# Variant 1 "tell me more": explain 3-step process, list matrix columns, security, free trial CTA
# Variant 2 "demo?": offer self-service trial (fastest) or call (if preferred)
# Variant 3 "setting up now": confirm, tip (upload full RFP), ask for feedback
# See Stage 1 Batch 11 for complete templates
STAGE1EOF

cat > outreach/reply-templates/security-concern.md << 'STAGE1EOF'
# Reply: Security Concern | Tier 3 ALWAYS
# Variant 1 "where does data go?": step-by-step architecture (upload->parse->extract->purge)
# Variant 2 "SOC 2?": honest "not yet, on roadmap" + current controls list
# Variant 3 "we handle CUI": RFPs themselves usually not CUI, zero-retention, on-prem waitlist
# Never make CMMC/NIST compliance assertions unless certified
# See Stage 1 Batch 11 for complete templates
STAGE1EOF

cat > outreach/reply-templates/price-objection.md << 'STAGE1EOF'
# Reply: Price Objection | Tier 3
# Variant 1 "too expensive": ROI math (12hrs * $80/hr = $960/bid vs $99/mo)
# Variant 2 "discount?": no ad-hoc discounts Month 1-3. Offer trial + annual waitlist.
# Variant 3 "need budget approval": provide ROI summary, security summary, no-contract note
# See Stage 1 Batch 11 for complete templates
STAGE1EOF

cat > outreach/reply-templates/not-now.md << 'STAGE1EOF'
# Reply: Not Now | Tier 3 | Post-reply: move to nurture, tag "timing"
# Variant 1 "maybe later": graceful, set 60-day reminder, mention free trial always available
# Variant 2 "between bid cycles": ask when next wave, set reminder for that date
# Variant 3 "just signed with competitor": position as complement, nurture list
# See Stage 1 Batch 11 for complete templates
STAGE1EOF

cat > outreach/reply-templates/not-interested.md << 'STAGE1EOF'
# Reply: Not Interested | Tier 3 | Post-reply: do-not-contact
# Variant 1 simple decline: graceful close, respect, wish clean proposals
# Variant 2 with reason: ask about their process (competitive intel), then close
# Variant 3 hostile: immediate apology, remove from all lists, flag company for 90 days
# See Stage 1 Batch 11 for complete templates
STAGE1EOF

cat > outreach/prospect-research/research-playbook.md << 'STAGE1EOF'
# Prospect Research Playbook
# Sources: SAM.gov (primary, free), LinkedIn Sales Nav ($99/mo), APMP communities, job boards
# SAM.gov: filter by NAICS 541511/541512/541519/541330/541611/541690/561210, set-asides, last 90 days
# LinkedIn: titles "Proposal Manager" OR "Capture Manager" OR "VP of BD", headcount 11-500
# Weekly rhythm: Mon research, Tue-Wed outreach, Thu follow-ups, Fri content
# Prospect DB fields: company, contact, title, email, LinkedIn, NAICS, set-aside,
# contracts, recent award, size, scores (R/I/DS), tag, gate result, status, dates, notes
# See Stage 1 Batch 11 for complete playbook with scoring details
STAGE1EOF

cat > outreach/campaigns/beta-launch.md << 'STAGE1EOF'
# Campaign: Beta Launch (Days 7-14)
# Goal: 10 beta testers, 3-5 paid conversions
# Target: Proposal Managers, 5+ active contracts, recent win, manual_workaround
# Days 7-10: 10 LinkedIn DMs/day. Days 10-12: 10 emails/day. Days 12-14: community seeding.
# Day 14 gate: 70+ outreach, 10+ trials, 5+ shreds, 3+ accuracy reviews, 95%+ recall
# If metrics not met: diagnose (messaging? UX? accuracy? pricing?) before public launch
# See Stage 1 Batch 11 for complete campaign plan
STAGE1EOF

cat > outreach/campaigns/public-launch.md << 'STAGE1EOF'
# Campaign: Public Launch (Day 14+)
# Goal: 10-15 new customers/month by Month 3
# Channels: LinkedIn DMs (40%), cold email (30%), APMP community (15%), content (15%)
# Weekly: Mon research, Tue DMs, Wed emails, Thu follow-ups, Fri content
# Scale: Month 1 manual (10/day) -> Month 2+ agent-assisted (50/day max)
# Prerequisite for agents: 10+ manual conversions with validated messaging
# See Stage 1 Batch 11 for complete campaign plan with channel metrics
STAGE1EOF

echo "  ✓ outreach/ (15 files)"

# ────────────────────────────────────────
# AUTONOMOUS CONFIG FILES (3 files)
# ────────────────────────────────────────

cat > autonomous/config/autonomy-levels.yaml << 'STAGE1EOF'
# Autonomy Levels | Path: autonomous/config/autonomy-levels.yaml
tiers:
  tier_1:
    name: Fully Autonomous
    actions: [research_prospect, score_prospect, tag_prospect_alternative, build_prospect_list, draft_email, draft_content, monitor_competitor, monitor_system_health, log_metrics, calculate_kpis, query_database_readonly, generate_recommendations, deduplicate_prospects, update_prospect_scores, classify_support_ticket]
  tier_2:
    name: Autonomous with Notification
    notification_channel: daily_digest
    actions: [send_follow_up_email, send_transactional_email, optimize_send_time, rotate_subject_line, segment_prospects, generate_daily_digest, generate_weekly_report, update_competitive_landscape_doc, send_nurture_email, resolve_known_support_issue]
  tier_3:
    name: Recommend and Wait
    approval_channel: approval_queue
    timeout_hours: 48
    actions: [send_first_touch_email, respond_to_prospect_reply, change_landing_page_copy, create_new_prospect_segment, suggest_pricing_change, respond_to_sensitive_support, update_revenue_forecast, publish_content, propose_new_experiment, contact_low_score_prospect, escalate_unknown_support_issue]
  tier_4:
    name: Human Only
    actions: [financial_transaction, change_pricing, legal_response, delete_data, access_credentials, binding_commitment, deploy_code, modify_database_schema, change_security_config, disable_safety_boundary, modify_autonomy_levels]
earned_autonomy:
  weeks_1_2: {mode: maximum_oversight, override_tier2_to_tier3: true}
  weeks_3_4: {mode: trust_building, condition: "approval_rate >= 0.90", action_on_met: restore_tier_2}
  month_2: {mode: expanded, candidates: [send_follow_up_email, send_nurture_email]}
  month_3_plus: {mode: full_operations, target_founder_time: 25_minutes_per_day}
revocation_triggers: [customer_complaint_about_automated_outreach, spam_complaint_or_blacklist, security_boundary_violation, contact_do_not_contact_prospect, rate_limit_exceeded, financial_impact_from_agent_error]
STAGE1EOF

cat > autonomous/config/approval-gates.yaml << 'STAGE1EOF'
# Approval Gates | Path: autonomous/config/approval-gates.yaml
approval_process:
  delivery:
    primary: daily_digest_email
    urgent: immediate_email
    dashboard: /app/approvals
  actions: {approve: execute_immediately, approve_with_edits: apply_then_execute, reject: cancel_with_reason, defer: requeue_max_3, expire: cancel_after_48hrs}
gates:
  first_touch_email:
    approver: founder
    context: [prospect_profile, scores, alternative_tag, template_variant, personalized_text, quality_rating]
    urgency: normal
  prospect_reply_response:
    approver: founder
    context: [original_thread, reply_text, classification, drafted_response]
    urgency: urgent
  landing_page_change:
    approver: founder
    context: [current_copy, proposed_copy, reason, expected_impact]
    urgency: normal
  revenue_forecast_update:
    approver: founder
    context: [current_assumptions, proposed_changes, variance_analysis]
    urgency: normal
  content_publication:
    approver: founder
    context: [content_draft, platform, topic_rationale]
    urgency: normal
STAGE1EOF

cat > autonomous/config/safety-boundaries.yaml << 'STAGE1EOF'
# Safety Boundaries | Path: autonomous/config/safety-boundaries.yaml
email_limits:
  max_emails_per_day: 50
  max_follow_ups_per_prospect: 3
  cooldown_between_emails_hours: 48
  require_unsubscribe_link: true
  max_emails_per_prospect_total: 4
prospect_gates:
  min_reachability_score: 4
  min_intent_signal_score: 4
  min_decision_speed_score: 4
  low_score_action: move_to_nurture_list
  require_current_alternative_tag: true
  require_personalization_hook: true
communication_safety:
  sentiment_floor: neutral
  never_contact_hostile_prospects: true
  never_contact_unsubscribed: true
  check_do_not_contact_before_every_action: true
data_safety:
  pii_handling: hash_before_logging
  never_store_document_content: true
  audit_trail_retention_days: 90
financial_safety:
  agents_cannot_make_purchases: true
  agents_cannot_change_pricing: true
system_safety:
  agents_cannot_deploy_code: true
  agents_cannot_modify_database_schema: true
  agents_cannot_modify_this_file: true
emergency_stop:
  enabled: true
  triggers: [unsubscribe_10_per_day, any_spam_complaint, stripe_fraud_dispute, error_rate_50pct_5min, tier_4_attempted, safety_violated_3x_24hr]
  actions: [pause_all_agents, cancel_queued_emails, set_all_tier_4, notify_founder]
STAGE1EOF

echo "  ✓ autonomous/config/ (3 files)"

# ────────────────────────────────────────
# AUTONOMOUS AGENT FILES (6 files)
# ────────────────────────────────────────

cat > autonomous/agents/prospect-hunter.md << 'STAGE1EOF'
# Autonomous Agent: Prospect Hunter
# Runs: Daily 06:00 ET | Model: Claude Sonnet + Gemini 2.5 Pro | Tier: 1
# 06:00 Discover (SAM.gov new awards, target NAICS, deduplicate)
# 06:30 Identify contacts (LinkedIn PM/Capture/BD titles)
# 07:00 Score (Reachability, Intent, Decision Speed using prospect-finder.md)
# 07:15 Tag current alternative (evidence-based, default: manual_workaround)
# 07:30 Queue (4+ on all three -> active_outreach, else -> nurture with reason)
# Weekly re-score nurture list. Never contact directly (queue only).
# See Stage 1 Batch 12 for complete operational specification
STAGE1EOF

cat > autonomous/agents/content-engine.md << 'STAGE1EOF'
# Autonomous Agent: Content Engine
# Runs: Bi-weekly Tuesdays 09:00 ET | Model: Claude Sonnet | Tier: 1/3
# Pillars: Compliance Craft, GovCon Operations, Industry Intelligence, Tool & Process
# Types: LinkedIn posts (150-300 words), articles (500-800), blog posts (800-1200)
# Rules: no competitor names, no unverified claims, always provide value
# All content -> approval queue (Tier 3) before publishing
# See Stage 1 Batch 12 for complete specification
STAGE1EOF

cat > autonomous/agents/campaign-optimizer.md << 'STAGE1EOF'
# Autonomous Agent: Campaign Optimizer
# Runs: Weekly Friday 15:00 ET | Model: Claude Sonnet + Gemini Flash | Tier: 1/2/3
# Analyzes: open rates, response rates, conversions by template/channel/segment
# Tier 2: rotate subject lines, adjust send times, rebalance channels
# Tier 3: propose new variants, retire underperforming segments
# Min 20 sends per variant before conclusions. Max 2 concurrent experiments.
# See Stage 1 Batch 12 for complete specification
STAGE1EOF

cat > autonomous/agents/engagement-responder.md << 'STAGE1EOF'
# Autonomous Agent: Engagement Responder
# Runs: Real-time (triggered) | Model: Claude Sonnet | Tier: 1/3
# Classifies replies: interested, security, price, not_now, not_interested, hostile
# Drafts response using reply-templates/, submits to approval queue (Tier 3 ALWAYS)
# Interested replies: flag urgent, target 4-hour response time
# Hostile: immediate founder alert, no auto-draft
# See Stage 1 Batch 12 for complete specification
STAGE1EOF

cat > autonomous/agents/metrics-sentinel.md << 'STAGE1EOF'
# Autonomous Agent: Metrics Sentinel
# Runs: Continuous | Model: Gemini Flash + Claude Sonnet | Tier: 1/2
# Every 5 min: health check. Daily 07:30: KPI collection. 08:00: daily digest.
# Weekly Monday: trend summary. Monthly 1st: forecast reconciliation (Tier 3).
# Alerts: error >5% (warning), >20% (critical), service down (critical),
# API spend >$50/day, cost >15% MRR, churn spike, MRR decline.
# See Stage 1 Batch 12 for complete specification
STAGE1EOF

cat > autonomous/agents/growth-experimenter.md << 'STAGE1EOF'
# Autonomous Agent: Growth Experimenter
# Runs: Bi-weekly Mondays 09:00 ET | Model: Claude Sonnet | Tier: 1/3
# Framework: Hypothesis -> Design -> Approve (Tier 3) -> Execute -> Analyze -> Decide
# Categories: outreach (subjects, channels), conversion (landing page, trial scope),
# retention (onboarding, engagement), channel (APMP, Reddit, partnerships)
# Max 2 concurrent experiments. 7-day minimum duration. Revert plan required.
# See Stage 1 Batch 12 for complete specification
STAGE1EOF

echo "  ✓ autonomous/agents/ (6 files)"

# ────────────────────────────────────────
# AUTONOMOUS QUEUE FILES (3 files)
# ────────────────────────────────────────

cat > autonomous/queues/approval-queue.md << 'STAGE1EOF'
# Approval Queue Specification
# Stage 2 implementation: Supabase table + /app/approvals dashboard page
# Item fields: id, submitted_at, submitted_by, action_type, urgency, expires_at,
# target (type/name/company/email), context (scores/tag/signal/quality),
# proposed_action (type/subject/body/template), risk_assessment, recommended_decision
# Founder actions: approve, approve_with_edits, reject (reason required), defer (max 3), expire (48hr)
# FIFO with urgency override. Edits logged for agent learning.
# See Stage 1 Batch 13 for complete YAML schema and example
STAGE1EOF

cat > autonomous/queues/action-log.md << 'STAGE1EOF'
# Action Log Specification
# Stage 2 implementation: Supabase table (action_log)
# Every agent action logged, including blocked/failed actions.

## Fields
id (uuid), timestamp (timestamptz), agent (text), tier (int 1-4),
action (text), target (text), result (text), details (jsonb)

## Result values: success, failed, blocked, pending_approval, expired

## Example: Prospect scored
    timestamp:  2026-03-15T06:30:00Z
    agent:      prospect-hunter
    tier:       1
    action:     score_prospect
    target:     prospect-abc123
    result:     success
    details:    {"reachability":5, "intent":5, "decision_speed":5, "gate":"active_outreach"}

## Example: Tier 4 violation blocked
    timestamp:  2026-03-16T06:00:00Z
    agent:      prospect-hunter
    tier:       4
    action:     access_credentials
    target:     system
    result:     blocked
    details:    {"reason":"tier_4_action_attempted", "alert_sent":true}

## Rules
1. Completeness: every action logged, no exceptions
2. Immutability: agents write only, never modify/delete
3. No PII in details: prospect IDs only, not names/emails
4. Retention: 90 days
5. Indexes: timestamp, agent, action, result
STAGE1EOF

cat > autonomous/queues/recommendation-queue.md << 'STAGE1EOF'
# Recommendation Queue Specification
# Non-blocking suggestion box. Agents drop ideas; founder reviews weekly.
# Fields: id, submitted_at, submitted_by, category (content_idea/experiment/
# competitive_response/feature_request/process_improvement/channel_expansion),
# priority (low/med/high), title, description, evidence, suggested_action, effort estimate
# High priority surfaces in daily digest. Medium/low weekly review only.
# Accepted -> appropriate workflow. Rejected -> logged with reason for learning.
# See Stage 1 Batch 13 for complete YAML schema
STAGE1EOF

echo "  ✓ autonomous/queues/ (3 files)"

# ────────────────────────────────────────
# AUTONOMOUS PLAYBOOK FILES (3 files)
# ────────────────────────────────────────

cat > autonomous/playbooks/daily-autonomous-ops.md << 'STAGE1EOF'
# Daily Autonomous Operations Playbook

## Schedule (ET)
06:00 Prospect Hunter: discover, score, tag, queue (Tier 1)
06:30 Email Writer: draft personalized emails (Tier 1)
07:00 Outreach Agent: queue first-touch (Tier 3), queue follow-ups (Tier 2)
07:30 Metrics Sentinel: collect daily KPIs (Tier 1)
08:00 Daily Digest sent to founder (Tier 2)
08:00-08:25 FOUNDER: review digest + approval queue (~25 min)
08:30 Outreach Agent: send approved emails (staggered, not bulk)
All day: Sentinel monitors health (5 min), Engagement Responder watches replies
17:00 Founder evening check (5 min, optional)
22:00 Overnight prep. No emails between 22:00-06:00.
Weekend: monitoring only, no outreach.

## Founder Time Budget
Daily: ~25 min. Weekly: ~3 hours. Monthly: +1 hour (forecast/competitive review).

## Vacation Mode
Set all agents to Tier 1 only. Approval items expire. Follow-ups pause.
Emergency stop triggers remain active.
STAGE1EOF

cat > autonomous/playbooks/escalation-rules.md << 'STAGE1EOF'
# Escalation Rules Playbook

## Level 1 - Informational (daily digest)
New competitor detected, scoring anomaly, minor metric deviation, feature request, positive feedback

## Level 2 - Attention Required (immediate email, respond within 4 hours)
Interested prospect reply, error rate >5%, Stripe webhook failure, daily limit approaching,
churn event, cost anomaly, negative feedback, competitive landscape change

## Level 3 - Urgent (immediate + action recommendation, respond within 1 hour)
Enterprise inquiry, legal threat, error rate >20%, security question, major competitive threat,
forecast divergence >20%, 3+ cancellations in one day

## Level 4 - Emergency (auto-action + immediate notification)
Emergency stop conditions, suspected breach, system unreachable 5+ min, fraud dispute, Tier 4 attempt
Auto-actions execute immediately. Founder notified via all channels.

## De-escalation: agent logs resolution, founder confirms (Level 3+), root cause documented, LESSONS.md updated
STAGE1EOF

cat > autonomous/playbooks/rollback-procedures.md << 'STAGE1EOF'
# Rollback Procedures Playbook
# Window: 24 hours. Beyond: manual intervention.

## By Action Type
Emails sent: cannot unsend. Send correction/apology. Add to do-not-contact if appropriate.
Prospect scoring: re-score with corrected logic. If wrongly contacted, treat as email rollback.
Follow-up sequences: cancel pending, reassign to correct sequence.
Content published: delete/unpublish, post correction if inaccurate claims.
Database issues: Tier 4 (founder only), use Supabase point-in-time recovery.

## Emergency Rollback (Full Stop)
1. Activate emergency stop  2. All agents pause  3. All queued emails canceled
4. Review action log (last 24hrs)  5. Fix root cause  6. Reactivate one agent at a time
7. Monitor 24hrs before restoring normal autonomy

## Post-Rollback Checklist
- [ ] Root cause identified and documented
- [ ] Fix applied and tested
- [ ] Affected parties notified
- [ ] Action log updated with rollback entry
- [ ] LESSONS.md updated
- [ ] Safety boundaries reviewed
- [ ] Autonomy level reviewed
STAGE1EOF

echo "  ✓ autonomous/playbooks/ (3 files)"

# ────────────────────────────────────────
# WORKFLOW FILES (5 files)
# ────────────────────────────────────────

cat > workflows/daily-operations.md << 'STAGE1EOF'
# Workflow: Daily Operations
# Month 1 (manual): 2 hrs/day — research, outreach, support, product checks
# Month 2+ (agent-assisted): 25 min/day — digest, approvals, quick actions
# See Stage 1 Batch 14 for complete hour-by-hour breakdown and decision trees
# Key decisions: interested reply -> respond within 4 hours, accuracy complaint ->
# respond within 2 hours + investigate + fix + add to corpus,
# churn spike -> check support tickets, outreach drop -> review messaging
STAGE1EOF

cat > workflows/prospect-pipeline.md << 'STAGE1EOF'
# Workflow: Prospect Pipeline
# DISCOVER -> SCORE -> QUALITY GATE -> TAG -> OUTREACH -> ENGAGE -> CONVERT

## Stage 1: DISCOVER (Tier 1)
SAM.gov new awards, target NAICS, deduplicate, find contacts on LinkedIn

## Stage 2: SCORE (Tier 1)
Reachability (1-5), Intent Signal (1-5), Decision Speed (1-5)

## Stage 3: ACQUISITION QUALITY GATE (Tier 1, MANDATORY)
IF reachability >= 4 AND intent >= 4 AND decision_speed >= 4:
  -> active_outreach (proceed to Stage 4)
ELSE:
  -> nurture_list (log reason, re-evaluate weekly)
NO EXCEPTIONS. Even founder-added prospects must pass the gate.

## Stage 4: CURRENT ALTERNATIVE TAGGING (Tier 1, MANDATORY)
Tag as: direct_competitor, indirect_tool, manual_workaround (default), status_quo
Evidence must be documented. Tag determines outreach template.

## Stage 5: OUTREACH (Tier 2/3)
Select template by tag. Personalize. First-touch -> Tier 3 approval.
Follow-ups -> Tier 2 auto with notification. Max 1+3 emails. 48hr cooldown.

## Stage 6: ENGAGE (Tier 3, all replies require approval)
Classify: interested/security/price/not_now/not_interested/hostile
Draft from reply-templates. Submit for founder approval.

## Stage 7: CONVERT (System, automatic)
Signup -> welcome email. Trial shred -> completion email. Subscribe -> onboarding.

## Pipeline Metrics
Prospects discovered/week: 20+. Quality gate pass: 30-50%.
Response rate: 10-20%. Trial signup: 30-40%. Conversion: 25-35%.
STAGE1EOF

cat > workflows/onboarding-flow.md << 'STAGE1EOF'
# Workflow: Onboarding Flow
# SIGNUP -> TRIAL SHRED -> EVALUATE -> SUBSCRIBE -> ACTIVATE -> RETAIN

## Signup: create profile, welcome email, redirect to dashboard
## Trial Shred: process RFP, display results, download matrix, trial completion email
## Evaluate: user reviews matrix (system observes: re-upload, pricing page visit)
## Subscribe: Stripe Checkout -> webhook -> profile updated -> confirmation email
## Activate: first paid shred. Day 3: power tips. Day 7: feedback request (critical).
## Retain: monthly engagement check. 30-day inactive = at-risk. 60-day = likely churn.
##   At-risk: re-engagement email. Likely churn: founder personal outreach.

## Activation target: 3+ shreds in first 30 days (high retention correlation)
## Key metrics: signup->trial 70%+, trial->download 90%+, trial->subscribe 25-35%,
## 30-day retention 93%+ (<7% churn)
STAGE1EOF

cat > workflows/support-escalation.md << 'STAGE1EOF'
# Workflow: Support Escalation
# RECEIVE -> CLASSIFY -> TRIAGE -> ROUTE -> RESOLVE -> FOLLOW-UP

## Classify (Tier 1): account, product-known, product-unknown, security, feature, feedback, enterprise
## Severity: critical (broken/security/data), high (accuracy/churn/enterprise), medium (known/billing), low (feature/feedback)

## Routing:
## Account known fix -> Tier 2 auto-resolve (1hr target)
## Product known -> Tier 2 auto-respond (2hr target)
## Product unknown / accuracy -> Tier 3 FOUNDER (2hr target)
## Security -> Tier 3 FOUNDER ALWAYS (4hr target)
## Enterprise -> Tier 3 FOUNDER IMMEDIATE (2hr target)
## Churn signal -> Tier 3 FOUNDER IMMEDIATE (2hr target)
## Feature request -> Tier 1 log + acknowledge (24hr target)

## Accuracy complaints (MOST IMPORTANT): respond 2hr, investigate, fix, add to corpus,
## follow up with customer when fixed. Turns complaint into loyalty.
STAGE1EOF

cat > workflows/growth-experiments.md << 'STAGE1EOF'
# Workflow: Growth Experiments
# HYPOTHESIZE -> DESIGN -> APPROVE -> EXECUTE -> ANALYZE -> DECIDE -> DOCUMENT

## Hypothesis format: "If we [change], then [metric] will [direction] by [amount], because [reason]."
## Design: one variable, control group, primary metric, min duration 7 days, revert plan
## Approve: Tier 3, all experiments require founder approval
## Execute: no mid-run changes, daily tracking, abort if >30% negative impact
## Analyze: compare to control, check side effects, assess significance
## Decide: winner (roll out), loser (revert), inconclusive (extend or redesign)
## Document: every experiment logged regardless of outcome

## Max 2 concurrent experiments. No experiments on security messaging or pricing
## without explicit founder approval. No experiments on enterprise prospects.

## Priority by stage:
## Month 1: trial UX, landing page, pricing sensitivity
## Month 2-3: outreach templates, channels, subject lines, trial scope
## Month 4-6: referrals, content topics, onboarding optimization
STAGE1EOF

echo "  ✓ workflows/ (5 files)"

# ────────────────────────────────────────
# FINISH
# ────────────────────────────────────────

echo ""
echo "============================================================"
echo " Stage 1 Setup Complete!"
echo "============================================================"
echo ""
echo " Files created: $(find . -type f | wc -l)"
echo " Directories created: $(find . -type d | wc -l)"
echo ""
echo " Next steps:"
echo "   1. Configure .env.local from .env.example"
echo "   2. Set up accounts: Vercel, Supabase, Stripe, Anthropic, Resend"
echo "   3. Tell Claude Code to start: it reads claude.md"
echo ""
echo " Full documentation: docs/"
echo " Test specs: qa/test-specs/"
echo " Build brief: claude.md"
echo "============================================================"

