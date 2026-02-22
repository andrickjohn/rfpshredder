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
