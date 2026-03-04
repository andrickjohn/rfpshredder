#!/bin/bash

# Move to the script's directory (project root)
cd "$(dirname "$0")"

echo "🔄 Stopping any existing server on port 3000..."
lsof -t -i:3000 | xargs kill -9 2>/dev/null || true

echo "🧹 Cleaning up Next.js cache to prevent 'module not found' issues..."
rm -rf .next

echo "🛑 Stopping any existing PM2 process for rfpshredder..."
npx --yes pm2 delete rfpshredder 2>/dev/null || true

echo "🚀 Starting RFP Shredder persistently in the background..."
npx --yes pm2 start "npm run dev" --name "rfpshredder"

echo ""
echo "================================================================"
echo "✅ SUCCESS: The local server is now running in the background!"
echo "🌐 You can access it anytime at: http://localhost:3000/dashboard"
echo ""
echo "🛠️  Helpful Commands:"
echo "  - View live logs:    npx --yes pm2 logs rfpshredder"
echo "  - Restart server:    npx --yes pm2 restart rfpshredder"
echo "  - Stop server:       npx --yes pm2 stop rfpshredder"
echo "================================================================"
