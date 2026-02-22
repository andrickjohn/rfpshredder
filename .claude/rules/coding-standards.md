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
