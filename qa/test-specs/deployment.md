# Test Specification: Deployment
# Path: qa/test-specs/deployment.md

## Acceptance Criteria
- [ ] Application deploys to Vercel without errors
- [ ] Custom domain resolves correctly with HTTPS
- [ ] All environment variables set in Vercel dashboard
- [ ] Database migrations applied to production Supabase
- [ ] Stripe webhooks configured for production URL
- [ ] Resend domain verified for production sending
- [ ] All security headers present in production responses
- [ ] Health check endpoint returns 200
- [ ] No console errors on any production page

## Integration Tests Required
- Test: curl -I https://yourdomain.com -> Expected: 200, all security headers present
- Test: curl https://yourdomain.com/api/health -> Expected: 200 {"status": "ok"}
- Test: Stripe test webhook to production URL -> Expected: 200
- Test: Visit every public page -> Expected: no console errors, correct rendering

## Security Tests Required
- Test: HTTPS enforced (HTTP redirects to HTTPS)
- Test: HSTS header present with correct max-age
- Test: No sensitive environment variables exposed in client bundle
- Test: Source maps not accessible in production

## What "Done" Looks Like
The application is live on a custom domain with HTTPS, all services connected, and all health checks passing. A user can visit the landing page, sign up, shred an RFP, and subscribe — all in production.
