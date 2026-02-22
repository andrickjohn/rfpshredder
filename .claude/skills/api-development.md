# Skill: API Development — Path: .claude/skills/api-development.md
# Every API route: 1. Validate (Zod) 2. Auth (JWT) 3. Authorize 4. Execute 5. Respond 6. Error handle
# /api/shred is the most complex endpoint: file reception -> validate -> parse -> chunk -> extract -> crossref -> excel -> respond
# Must complete within 300s Vercel timeout. Stream progress if possible.
# Error codes: VALIDATION_ERROR (400), AUTH_REQUIRED (401), SUBSCRIPTION_REQUIRED (403), TRIAL_EXHAUSTED (403),
# RATE_LIMITED (429), FILE_TOO_LARGE (400), UNSUPPORTED_FILE_TYPE (400), PAGE_LIMIT_EXCEEDED (400),
# PROCESSING_FAILED (500), PROCESSING_TIMEOUT (504), SECTIONS_NOT_FOUND (422), EXTERNAL_API_ERROR (502)
