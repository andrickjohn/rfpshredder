---
description: Hello - orient yourself, check project health, and greet the session
---

# /hello - Start a Session

Orient the session, review messages, and ensure a clean working state.

## Steps

1. Greet the user with an "Aloha" and a welcoming message.

2. Check if `.message_in_a_bottle.txt` exists and read it:
// turbo-all
```bash
if [ -f .message_in_a_bottle.txt ]; then cat .message_in_a_bottle.txt; else echo "No message in a bottle found."; fi
```
- If there's a message, read its contents to the user to help explain what to do next.

3. Read `claude.md` for project context, `PROGRESS.md` for the latest milestone status, and `LESSONS.md` for known pitfalls.

4. Check the radar for strange behavior or divergence:
// turbo-all
```bash
git fetch origin > /dev/null 2>&1
git status
```

5. Check for any `.env.local` issues (confirm required keys are present without printing values):
// turbo-all
```bash
grep -E "^(NEXT_PUBLIC|SUPABASE|STRIPE|OPENAI|RESEND)" .env.local | cut -d= -f1 || echo "No .env.local found"
```

6. Ensure the local development server is running cleanly:
// turbo-all
```bash
lsof -i :3000 | awk 'NR!=1 {print $2}' | xargs -r kill -9 && pkill -9 -f "next dev" || true && npm run dev &
```

7. Report back to the user with the git status, env key status, your understanding of what to work on next, and let them know you're ready to launch!
