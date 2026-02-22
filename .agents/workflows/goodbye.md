---
description: Goodbye — wrap up, save all work, and leave a clean handoff note
---

# /goodbye — End Session & Handoff

Run this at the end of every session to save work and document the handoff.

## Steps

1. Run `/sync` first to commit and push all current work (see sync.md)
2. Update `PROGRESS.md` with:
   - What was completed this session
   - What is in-progress or blocked
   - Recommended next steps for the next session
3. Update `LESSONS.md` if any new gotchas, decisions, or important context was discovered
4. Do a final git status to confirm everything is committed and pushed:
   ```
   cd /Users/john/Projects/rfpshredder && git status && git log --oneline -3
   ```
5. Report a clean session summary to the user:
   - What was accomplished
   - What's left / what to tackle next session
   - Any open questions or decisions needed from the user
   - Confirmation that all work is saved to GitHub
