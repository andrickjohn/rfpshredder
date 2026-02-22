---
description: Hello — orient yourself, check project health, and greet the session
---

# /hello — Session Start & Project Orientation

Run this at the start of every session to get your bearings.

## Steps

1. Read `claude.md` for project context and current objectives
2. Read `PROGRESS.md` for the latest milestone status
3. Read `LESSONS.md` for known pitfalls to avoid
4. Run a quick health check:
   ```
   cd /Users/john/Projects/rfpshredder && git status && git log --oneline -5
   ```
5. Check for any `.env.local` issues (confirm required keys are present without printing values):
   ```
   grep -E "^(NEXT_PUBLIC|SUPABASE|STRIPE|OPENAI|RESEND)" /Users/john/Projects/rfpshredder/.env.local | cut -d= -f1
   ```
6. Report back to the user:
   - Current branch and last 5 commits
   - Any uncommitted changes
   - Which env keys are configured
   - Your understanding of what to work on next based on PROGRESS.md
