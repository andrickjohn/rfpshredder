# RFP Shredder — Lessons Learned
# Updated by Claude Code after every fix. Read before starting each new component.

---

## Lesson 1: SQL injection in email is RFC-valid
- **Date**: 2026-02-21
- **Component**: Auth validation
- **What happened**: Test expected `admin'--@evil.com` to fail Zod email validation, but single quotes are RFC-valid in email local parts
- **Root cause**: Zod validates against RFC 5321, which allows special characters in the local part
- **Fix applied**: Updated test to use clearly invalid SQL patterns. Added comment that parameterized queries (Supabase) are the real defense layer.
- **Prevention rule**: Never rely solely on email format validation for SQL injection prevention. Always use parameterized queries.
- **Applies to**: All input validation, all database queries

---

## Lesson 2: Vitest jsdom environment conflicts with ESM-only deps
- **Date**: 2026-02-21
- **Component**: Test infrastructure
- **What happened**: `vitest` with `environment: 'jsdom'` failed because jsdom pulls in `@csstools/css-calc` which is ESM-only
- **Root cause**: jsdom dependency chain includes CJS modules that try to `require()` ESM-only packages
- **Fix applied**: Switched to `environment: 'node'` for pure function unit tests
- **Prevention rule**: Use `environment: 'node'` for non-DOM tests. Only use `jsdom` when testing React components.
- **Applies to**: All vitest configuration

---

## Lesson 3: Character offset page-finding breaks on join separators
- **Date**: 2026-02-22
- **Component**: Section detector
- **What happened**: Page boundary detection using character offsets attributed a section header to the wrong page because the regex match started at a `\n` separator between pages
- **Root cause**: When pages are joined with `\n\n`, regex matches that begin at the separator fall in the previous page's character range, causing off-by-one attribution
- **Fix applied**: Replaced character-offset math with per-page regex search — test each page's text directly for the section pattern
- **Prevention rule**: When mapping regex match positions back to source pages, search each page directly instead of doing character-offset arithmetic across concatenated text
- **Applies to**: Any code that maps positions in concatenated text back to source segments

---

## Lesson 4: pdf-parse default export incompatible with Next.js webpack
- **Date**: 2026-02-22
- **Component**: PDF parser / API route
- **What happened**: `import pdfParse from 'pdf-parse'` caused "does not contain a default export" error when Next.js compiled the `/api/shred` route
- **Root cause**: pdf-parse's ESM exports don't expose a default export compatible with Next.js's webpack bundler; works fine in Vitest (Node native) but breaks in Next.js SSR
- **Fix applied**: Changed to `const pdfParse = require('pdf-parse')` with eslint-disable comment
- **Prevention rule**: When a Node.js library fails as ESM import in Next.js, fall back to `require()`. Always verify API routes compile in `next dev`, not just vitest.
- **Applies to**: Any npm package imported in Next.js API routes that has ESM/CJS dual-export issues

---

## Lesson 5: Email subject lines must be verified against length limits
- **Date**: 2026-02-22
- **Component**: Email templates
- **What happened**: trial_completion subject line was 55 chars (`Your compliance matrix is ready — N requirements found`), exceeding the 50-char max from email-automation.md spec
- **Root cause**: Dynamic content (requirement count) makes subject length variable; template was written without checking final rendered length
- **Fix applied**: Shortened to `N requirements extracted` (under 30 chars)
- **Prevention rule**: Always check rendered subject length against the 50-char limit, especially for templates with dynamic data. Test with realistic values.
- **Applies to**: All email templates with dynamic content

---

## Lesson 6: Vitest vi.mock with class constructors needs actual class syntax
- **Date**: 2026-02-22
- **Component**: Email send tests
- **What happened**: `vi.fn().mockImplementation(() => ({ emails: { send: mockSend } }))` failed with "is not a constructor" when `new Resend()` was called in the module under test
- **Root cause**: `vi.fn().mockImplementation()` creates a mock function, not a class. When the module uses `new ClassName()`, the mock must be a proper class/constructor.
- **Fix applied**: Changed mock to `class MockResend { emails = { send: mockSend }; }`
- **Prevention rule**: When mocking a class that's instantiated with `new`, use actual class syntax in vi.mock, not vi.fn().mockImplementation().
- **Applies to**: Any vitest mock of npm packages that export classes (Stripe, Resend, etc.)

---

## Lesson 7: Vercel production build is stricter than local dev and vitest
- **Date**: 2026-02-22
- **Component**: Build / deployment
- **What happened**: Vercel build failed on 4 issues that never surfaced in `next dev` or `vitest run`: (1) unused `error` variables in catch blocks, (2) `Buffer` not assignable to `BodyInit` in NextResponse, (3) `Promise` vs `PromiseLike` for Supabase's PostgrestFilterBuilder, (4) `for...of` on Map/Set without `downlevelIteration`
- **Root cause**: Vercel runs `next build` which enables ESLint + strict TypeScript type checking. Local dev (`next dev`) skips type checking. Vitest uses its own tsconfig which may differ.
- **Fix applied**: (1) `catch {}` instead of `catch (error) {}`, (2) `new Uint8Array(buffer)` for NextResponse body, (3) `PromiseLike` instead of `Promise` in interface, (4) `.forEach()` instead of `for...of` on Map/Set
- **Prevention rule**: Always run `npx next build` locally before deploying to Vercel. It catches ESLint and type errors that dev mode ignores.
- **Applies to**: All Vercel deployments, all Next.js projects
