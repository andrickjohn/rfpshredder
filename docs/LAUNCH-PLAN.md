# RFP Shredder — Launch Plan

## Pre-Launch Checklist

### Required Before Beta (Day 1)

- [ ] **Supabase migration**: Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor
- [ ] **Verify Supabase env vars** on Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **Anthropic API key**: Set `ANTHROPIC_API_KEY` on Vercel (get from console.anthropic.com)
- [ ] **Resend setup**: Verify domain in Resend dashboard, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on Vercel
- [ ] **Cron secret**: Generate and set `CRON_SECRET` on Vercel (any random string, e.g. `openssl rand -hex 32`)
- [ ] **App URL**: Set `NEXT_PUBLIC_APP_URL` to your production domain on Vercel
- [ ] **Health check**: Visit `/api/health` — should return `healthy` or `degraded` (degraded = Stripe not yet configured, which is fine for beta)
- [ ] **Test signup flow**: Create an account, verify redirect to dashboard
- [ ] **Test shred flow**: Upload a test PDF, verify Excel download works

### Required Before Public Launch (Day 7+)

- [ ] **Stripe account**: Sign up at dashboard.stripe.com
- [ ] **Stripe product**: Create product "Solo Plan" with $99/month recurring price
- [ ] **Stripe env vars** on Vercel: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_SOLO_MONTHLY`
- [ ] **Stripe webhook**: Create webhook endpoint pointing to `https://yourdomain.com/api/billing/webhook`
  - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Set `STRIPE_WEBHOOK_SECRET` on Vercel
- [ ] **Custom domain**: Add domain in Vercel project settings → Domains
- [ ] **Legal pages**: Replace placeholder Privacy Policy, Terms of Service, Security page content
- [ ] **Testimonials**: Replace placeholder quotes with real beta tester feedback

### Environment Variables Summary

| Variable | Where | When Needed |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Day 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Day 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Day 1 |
| `ANTHROPIC_API_KEY` | Vercel | Day 1 |
| `RESEND_API_KEY` | Vercel | Day 1 |
| `RESEND_FROM_EMAIL` | Vercel | Day 1 |
| `CRON_SECRET` | Vercel | Day 1 |
| `NEXT_PUBLIC_APP_URL` | Vercel | Day 1 |
| `STRIPE_SECRET_KEY` | Vercel | Pre-public |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel | Pre-public |
| `STRIPE_WEBHOOK_SECRET` | Vercel | Pre-public |
| `STRIPE_PRICE_SOLO_MONTHLY` | Vercel | Pre-public |

---

## Day-by-Day Launch Plan

### Day 1: Soft Launch (Beta)
- Complete pre-launch checklist above
- Invite 5-10 trusted contacts (GovCon proposal managers)
- Send them direct links to signup
- Monitor `/api/health` for status
- Check Vercel logs for errors: `vercel logs --follow`
- Review Supabase dashboard for new signups
- Collect feedback on: upload experience, Excel quality, processing time

### Day 2: Fix & Iterate
- Review Day 1 feedback
- Fix any reported bugs
- Check email delivery in Resend dashboard (welcome emails sent?)
- Monitor Anthropic API usage (console.anthropic.com)
- Ask beta testers: "Does the compliance matrix match what you'd build manually?"

### Day 3: Expand Beta
- Invite 5-10 more testers if Day 1-2 stable
- Start collecting testimonials from happy testers
- Review shred_log in Supabase for processing metrics (time, page counts)
- Tune extraction prompts if accuracy feedback warrants it

### Day 4: Stripe Setup
- Create Stripe account and configure products
- Set all Stripe env vars on Vercel
- Test full flow: signup → trial shred → checkout → subscribe → unlimited shreds
- Test webhook handling: subscribe → cancel → re-subscribe
- Verify billing portal works (manage subscription button on dashboard)

### Day 5: Pre-Public Polish
- Replace testimonial placeholders with real beta feedback
- Write Privacy Policy, Terms of Service, Security page content
- Add custom domain if ready
- Run Lighthouse audit on landing page
- Test at mobile, tablet, desktop viewports

### Day 6: Public Prep
- Final round of testing with Stripe live keys (not test keys)
- Switch `STRIPE_SECRET_KEY` from `sk_test_` to `sk_live_` (and publishable key)
- Update webhook endpoint to live mode
- Verify trial_nudge cron is running (check Vercel Cron dashboard)
- Prepare announcement post / email to network

### Day 7: Public Launch
- Go live — share landing page URL
- Monitor closely for first 4 hours
- Check `/api/health` every hour
- Watch Vercel logs, Supabase metrics, Stripe dashboard
- Respond quickly to any support requests
- Celebrate

---

## Monitoring Endpoints

| Endpoint | Purpose | Expected |
|---|---|---|
| `GET /api/health` | System health | `{ status: "healthy" }` |
| `GET /api/cron/trial-nudge` | Trial nudge cron (requires `CRON_SECRET`) | Runs daily 09:00 UTC |
| Vercel Dashboard → Logs | Runtime errors | No 500s |
| Supabase Dashboard → Auth | Signups | Growing |
| Resend Dashboard | Email delivery | No bounces |
| Anthropic Console | API usage | Within budget |

---

## Rollback Procedure

If something breaks in production:

1. **Identify**: Check `/api/health` and Vercel logs
2. **Rollback**: `npx vercel rollback` — reverts to previous working deployment
3. **Diagnose**: Review logs, reproduce locally
4. **Fix**: Apply fix, run `npx next build` locally, verify tests pass
5. **Redeploy**: `npx vercel --prod --yes`
