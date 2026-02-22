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
