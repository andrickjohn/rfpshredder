---
description: Ship — run pre-flight checks and deploy to production
---

# /ship — Deploy to Production

Run all pre-flight checks, then push and deploy to production.

## Steps

### Pre-flight Checks
1. Confirm you are on `main` branch and it is clean:
   ```
   cd /Users/john/Projects/rfpshredder && git status && git branch
   ```
2. Run the type checker:
   ```
   npx tsc --noEmit
   ```
3. Run the linter:
   ```
   npm run lint
   ```
4. Run unit tests:
   ```
   npm run test -- --run
   ```
5. Do a local production build to verify it compiles:
   ```
   npm run build
   ```
6. If any of steps 2–5 fail, **STOP**. Fix the issues before proceeding.

### Deploy
7. Sync latest to GitHub:
   ```
   git push origin main
   ```
8. Vercel auto-deploys from `main`. Check deployment status at:
   https://vercel.com/dashboard
9. Once deployed, smoke-test the production URL:
   - Visit the landing page
   - Try logging in
   - Upload a test RFP document and verify the shredder runs
10. Report deployment URL, commit hash, and smoke test results to the user
11. Update `PROGRESS.md` with the ship date and what version was released
