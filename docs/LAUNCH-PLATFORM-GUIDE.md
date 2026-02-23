# RFP Shredder — Launch Platform Access Guide

## Overview

Your RFP Shredder app is deployed on **Vercel** with continuous deployment from GitHub. Every push to `main` automatically triggers a new production deployment.

---

## 🚀 PRODUCTION ACCESS

### **Live Application**
**URL**: https://rfpshredder-rho.vercel.app

### **Vercel Dashboard** (Primary Control Center)
**URL**: https://vercel.com/andrickjohn/rfpshredder

**Login**: Use your GitHub account (andrickjohn)

**What you can do here:**
- View deployment status and history
- Monitor real-time logs
- Configure environment variables
- View analytics and performance metrics
- Set up custom domains
- Trigger manual deployments or rollbacks
- Configure Vercel Cron jobs

---

## 📊 MONITORING & ANALYTICS

### **1. Vercel Dashboard**
- **Deployments**: https://vercel.com/andrickjohn/rfpshredder/deployments
  - See all deployments (production + preview)
  - Check build logs for each deployment
  - Rollback to any previous deployment with one click

- **Analytics**: https://vercel.com/andrickjohn/rfpshredder/analytics
  - Page views, unique visitors
  - Top pages, referrers
  - Device and browser breakdown
  - (Requires Vercel Pro for full analytics)

- **Logs**: https://vercel.com/andrickjohn/rfpshredder/logs
  - Real-time function logs
  - Filter by severity (error, warn, info)
  - Search for specific requests or errors

- **Speed Insights**: https://vercel.com/andrickjohn/rfpshredder/speed-insights
  - Core Web Vitals (LCP, FID, CLS)
  - Real user monitoring

### **2. Supabase Dashboard**
**URL**: https://supabase.com/dashboard/project/aowyjabngjevofhttxgm

**What you can monitor:**
- **Auth**: User signups, active sessions
  - Dashboard → Authentication → Users
  - See all registered users, email verification status

- **Database**: Table editor, SQL editor
  - Dashboard → Table Editor → profiles (user data)
  - Dashboard → Table Editor → shred_log (processing history)

- **API**: Request logs, query performance
  - Dashboard → API → Logs

- **Storage**: (Not used in MVP - zero retention architecture)

### **3. Stripe Dashboard** (When configured)
**URL**: https://dashboard.stripe.com

**Monitor:**
- Subscriptions (active, canceled, past due)
- Failed payments
- MRR (Monthly Recurring Revenue)
- Customer portal usage

### **4. Resend Dashboard** (Email delivery)
**URL**: https://resend.com/emails

**Monitor:**
- Email delivery status (sent, delivered, bounced, complained)
- Open rates (if tracking pixels enabled)
- Domain verification status

### **5. Anthropic Console** (AI API usage)
**URL**: https://console.anthropic.com

**Monitor:**
- API key usage (requests, tokens consumed)
- Costs and budget alerts
- Rate limits

---

## 🔧 CONFIGURATION & SETTINGS

### **Environment Variables** (Vercel)
Access at: https://vercel.com/andrickjohn/rfpshredder/settings/environment-variables

**Current Production Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY` (when Stripe configured)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO_MONTHLY`

**To update an environment variable:**
1. Go to Settings → Environment Variables
2. Click the variable name
3. Update the value
4. Redeploy for changes to take effect (Vercel prompts you)

### **Domains** (Vercel)
Access at: https://vercel.com/andrickjohn/rfpshredder/settings/domains

**Current domain**: rfpshredder-rho.vercel.app (Vercel subdomain)

**To add a custom domain:**
1. Purchase domain (e.g., rfpshredder.com from Namecheap, Google Domains)
2. Vercel → Settings → Domains → Add Domain
3. Enter domain name (e.g., rfpshredder.com)
4. Follow DNS configuration instructions
5. Vercel auto-issues SSL certificate

### **Cron Jobs** (Vercel)
Configured in `vercel.json` at project root.

**Current cron:**
- `/api/cron/trial-nudge` — daily at 09:00 UTC
- Sends nudge emails to trial users after 24 hours

**To modify cron schedule:**
1. Edit `vercel.json` in your local project
2. Change the `schedule` field (uses cron syntax)
3. Commit and push to GitHub
4. Vercel automatically updates cron configuration

**View cron logs:**
- Vercel Dashboard → Logs → Filter by `/api/cron/trial-nudge`

---

## 🔥 COMMON OPERATIONS

### **1. Deploy a New Version**
```bash
# Local development
cd /Users/john/Projects/rfpshredder
git add -A
git commit -m "Your commit message"
git push origin main
```
- **Vercel automatically detects the push and deploys**
- Monitor progress at: https://vercel.com/andrickjohn/rfpshredder/deployments
- Deployment usually takes 1-2 minutes

### **2. Rollback to Previous Version**
1. Go to: https://vercel.com/andrickjohn/rfpshredder/deployments
2. Find the working deployment
3. Click the "..." menu → "Promote to Production"
4. Or use CLI: `npx vercel rollback`

### **3. View Real-Time Logs**
**Via Dashboard:**
- https://vercel.com/andrickjohn/rfpshredder/logs
- Filter by function name (e.g., `/api/shred`)
- Filter by log level (error, warn, info)

**Via CLI:**
```bash
npx vercel logs --follow
# Or filter by function:
npx vercel logs /api/shred --follow
```

### **4. Run a Manual Deployment**
**Via CLI:**
```bash
cd /Users/john/Projects/rfpshredder
npx vercel --prod
```

**Via Dashboard:**
1. Go to: https://vercel.com/andrickjohn/rfpshredder/deployments
2. Click "Redeploy" on any deployment
3. Choose "Use existing Build Cache" or "Rebuild"

### **5. Check Health Status**
**Production health endpoint:**
```bash
curl https://rfpshredder-rho.vercel.app/api/health | jq
```

**Expected response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T...",
  "version": "1.0.0",
  "checks": {
    "supabase": "ok",
    "stripe": "ok",
    "anthropic": "ok",
    "resend": "ok"
  }
}
```

### **6. Test a Feature Locally**
```bash
cd /Users/john/Projects/rfpshredder
npm run dev
# Open http://localhost:3000
```

---

## 🔐 SECURITY & ACCESS

### **Vercel Account**
- **Owner**: andrickjohn (GitHub account)
- **Team**: Personal account (free)
- **To add collaborators**: Settings → Team Members

### **GitHub Repository**
- **URL**: https://github.com/andrickjohn/rfpshredder
- **Branch protection**: None (currently)
- **Deploy previews**: Automatic for all branches

### **API Keys & Secrets**
- **Storage**: Vercel environment variables (encrypted at rest)
- **Access**: Only visible to project owner
- **Rotation**: Update in Vercel dashboard + redeploy

### **Database Access**
- **Supabase RLS**: Row-level security enabled on all tables
- **Service role key**: Only used in API routes, never exposed to client
- **Backup**: Supabase free tier includes daily backups (7 days retention)

---

## 📈 SCALING & UPGRADES

### **Current Tier: Vercel Pro ($20/mo)**
**Limits:**
- Bandwidth: 1TB/month
- Build time: 100 hours/month
- Serverless function execution: 1000 GB-hours
- Cron jobs: Included

**If you exceed limits:**
- Vercel sends warnings at 80%, 90%, 100%
- Functions may throttle or return 429 (rate limit)
- **Action**: Upgrade to Enterprise or optimize

### **Supabase Free Tier**
**Limits:**
- Database: 500MB
- Auth users: 50,000
- API requests: 500,000/month

**Upgrade triggers** (per LAUNCH-PLAN.md):
- $500 MRR → Supabase Pro ($25/mo)
- $2,000 MRR → Consider database optimization

### **Anthropic API**
**Free tier**: None (pay-as-you-go)
**Current pricing**: ~$3-$8 per Claude Sonnet call (varies by document size)

**Cost monitoring:**
- Set budget alerts in Anthropic console
- Track cost per shred in application logs
- Estimate: ~$5 average per RFP processed

---

## 🚨 TROUBLESHOOTING

### **Problem: Deployment Failed**
1. Check build logs: Vercel Dashboard → Deployments → Click failed deployment
2. Common causes:
   - TypeScript errors (run `npx next build` locally)
   - Missing environment variables
   - Package.json dependency issues
3. Fix locally, commit, push again

### **Problem: 500 Error on Production**
1. Check function logs: Vercel Dashboard → Logs
2. Filter by "error" severity
3. Look for stack trace or error message
4. Common causes:
   - Missing environment variable (check `/api/health`)
   - Database connection issue (Supabase dashboard)
   - API key expired (rotate in Vercel settings)

### **Problem: Users Can't Sign Up**
1. Check Supabase Auth logs: Supabase Dashboard → Auth → Logs
2. Verify email provider configured: Supabase → Auth → Providers → Email
3. Check rate limits: Supabase Auth has 60/hr signup limit on free tier
4. Verify Resend API key working: Resend Dashboard → Emails

### **Problem: /api/shred Times Out**
1. Check function logs for error
2. Verify Anthropic API key valid: Anthropic Console
3. Check document size (max 50MB, 300 pages)
4. Increase Vercel function timeout (Settings → Functions → Max Duration)
   - Free: 10s, Hobby: 10s, Pro: 60s, Enterprise: 900s

### **Problem: Cron Job Not Running**
1. Verify `vercel.json` has correct schedule
2. Check cron logs: Vercel Dashboard → Logs → Filter by `/api/cron/`
3. Ensure `CRON_SECRET` environment variable is set
4. Test manually: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://rfpshredder-rho.vercel.app/api/cron/trial-nudge`

---

## 📞 SUPPORT RESOURCES

### **Vercel**
- Docs: https://vercel.com/docs
- Status: https://vercel-status.com
- Support: https://vercel.com/support (or support@vercel.com for Pro)

### **Supabase**
- Docs: https://supabase.com/docs
- Status: https://status.supabase.com
- Support: https://supabase.com/dashboard/support/new (or Discord for community)

### **Next.js**
- Docs: https://nextjs.org/docs
- GitHub: https://github.com/vercel/next.js/discussions

### **Anthropic**
- Docs: https://docs.anthropic.com
- Support: support@anthropic.com

---

## 🎯 LAUNCH DAY CHECKLIST

### **Pre-Launch (Do Now)**
- [ ] Verify `/api/health` returns "healthy"
- [ ] Test signup flow end-to-end
- [ ] Test shred flow with sample PDF
- [ ] Verify new processing flow diagram animates correctly
- [ ] Check all email templates in Resend
- [ ] Set up Stripe (if ready for billing)
- [ ] Add custom domain (if purchased)
- [ ] Review Vercel usage limits

### **Launch Day (Day 1)**
- [ ] Send beta invites (5-10 people)
- [ ] Monitor Vercel logs in real-time: `npx vercel logs --follow`
- [ ] Watch Supabase Auth dashboard for signups
- [ ] Check Resend for email delivery
- [ ] Respond quickly to any errors

### **Post-Launch Monitoring**
- [ ] Check `/api/health` every hour
- [ ] Review error logs daily (Vercel → Logs → Filter: error)
- [ ] Monitor Anthropic API costs (Console → Usage)
- [ ] Track signup → shred conversion rate (Supabase queries)
- [ ] Review processing times (shred_log.processing_time_ms)

---

## 🔗 QUICK LINKS

| Resource | URL |
|----------|-----|
| **Production App** | https://rfpshredder-rho.vercel.app |
| **Vercel Dashboard** | https://vercel.com/andrickjohn/rfpshredder |
| **GitHub Repo** | https://github.com/andrickjohn/rfpshredder |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/aowyjabngjevofhttxgm |
| **Resend Dashboard** | https://resend.com/emails |
| **Anthropic Console** | https://console.anthropic.com |
| **Stripe Dashboard** | https://dashboard.stripe.com |
| **Health Check** | https://rfpshredder-rho.vercel.app/api/health |

---

## 📝 NOTES

- **Zero retention architecture**: No documents stored. All processing in /tmp, purged after response.
- **Auto-deploy**: Every push to `main` triggers production deployment.
- **Cron authentication**: `/api/cron/*` endpoints require `CRON_SECRET` header.
- **Rate limiting**: Enforced in middleware (see `src/lib/rate-limit.ts`).
- **Test mode**: Use `.env.local` for local development (never commit this file).

---

**Last updated**: 2026-02-23
**Version**: 1.0.0
**Maintained by**: Claude Code + John Andrick
