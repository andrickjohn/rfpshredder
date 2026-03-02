---
description: Goodbye - wrap up, save all work, and leave a clean handoff note
---

# /goodbye - Wrap Up the Session

Log session notes, leave a message in a bottle for the next session, save progress, and say goodbye.

## Steps

1. Run `/sync` first to commit and push all current work.

2. Update `PROGRESS.md` with what was completed this session and what is up next. 
3. Update `LESSONS.md` if any new gotchas or decisions were discovered.

4. Ask the user: "What needs to be done next? (Bottle message)"

5. Save their message into `.message_in_a_bottle.txt` using a file-editing tool.

6. Do a final git status check:
// turbo-all
```bash
git status && git log --oneline -3
```

7. Give the user a brief, friendly "Aloha" type farewell, confirming all work is saved.
