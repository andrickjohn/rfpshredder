---
description: Sync — stage, commit, and push current work to GitHub
---

# /sync — Save Progress to GitHub

Commit and push all current work-in-progress to the remote repository.

## Steps

1. Fetch latest from remote and check for divergence:
   ```
   cd /Users/john/Projects/rfpshredder && git fetch origin && git status -sb
   ```
   - If remote is **ahead** of local (e.g. `behind 2`), **STOP and confirm with the user** before proceeding:
     > "⚠️ Remote has X commit(s) that aren't in your local branch. Do you want to pull first, or push anyway (force)? Pushing now could overwrite remote changes."
   - If remote is **behind** or **even**, continue to step 2.
   - If there is **divergence** (both ahead and behind), warn the user and recommend running `git pull --rebase` before proceeding.

2. Check what's changed locally:
   ```
   git status && git diff --stat
   ```
3. Stage all changes:
   ```
   git add -A
   ```
4. Ask the user for a commit message, or auto-generate one based on what files changed (summarize the key areas touched in one line, present tense, e.g. "Add billing webhook handler and update Stripe types")
5. Commit with the message:
   ```
   git commit -m "<message>"
   ```
6. Push to origin:
   ```
   git push origin main
   ```
7. Confirm push succeeded and report the commit hash and summary to the user
8. Update `PROGRESS.md` if significant milestones were completed in this session
