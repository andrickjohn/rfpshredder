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
