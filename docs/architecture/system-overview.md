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
