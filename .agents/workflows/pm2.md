---
description: Start server persistently in the background via PM2
---

# /pm2 - Start Server persistently

Start the Next.js development server using PM2 so that it runs persistently in the background and automatically restarts on crashes.

## Steps

1. Run the persistent startup script to clear cache and start PM2:
// turbo-all
```bash
./start-persistent.sh
```

2. Report back to the user that the server has been started in the background via PM2. Provide the common PM2 commands, ensuring they run `npx pm2` so we don't rely on global pm2:
- View live logs: `npx --yes pm2 logs rfpshredder`
- Restart server: `npx --yes pm2 restart rfpshredder`
- Stop server: `npx --yes pm2 stop rfpshredder`
