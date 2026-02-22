---
description: Sync — stage, commit, and push current work to GitHub
---

# /sync — Save Progress to GitHub

Commit and push all current work-in-progress to the remote repository.

## Steps

1. Check what's changed:
   ```
   cd /Users/john/Projects/rfpshredder && git status && git diff --stat
   ```
2. Stage all changes:
   ```
   git add -A
   ```
3. Ask the user for a commit message, or auto-generate one based on what files changed (summarize the key areas touched in one line, present tense, e.g. "Add billing webhook handler and update Stripe types")
4. Commit with the message:
   ```
   git commit -m "<message>"
   ```
5. Push to origin:
   ```
   git push origin main
   ```
6. Confirm push succeeded and report the commit hash and summary to the user
7. Update `PROGRESS.md` if significant milestones were completed in this session
