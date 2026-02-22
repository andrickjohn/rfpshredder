# Test Specification: Billing System
# Path: qa/test-specs/billing.md

## Acceptance Criteria
- [ ] User can initiate Stripe Checkout for Solo plan ($99/month)
- [ ] Successful checkout creates/updates subscription in profiles table
- [ ] User can access Stripe Customer Portal to manage subscription
- [ ] Webhook handles: checkout.session.completed
- [ ] Webhook handles: customer.subscription.updated
- [ ] Webhook handles: customer.subscription.deleted
- [ ] Webhook handles: invoice.payment_failed
- [ ] Webhook signature is verified on every request
- [ ] Duplicate webhook events are handled idempotently
- [ ] Trial user is limited to 1 shred (100 pages)
- [ ] Active subscriber has unlimited shreds (300 pages)
- [ ] Canceled subscriber loses shred access at period end

## Unit Tests Required
- Test: createCheckoutSession(userId, priceId) -> Expected: valid Stripe session URL
- Test: handleWebhook(invalid-signature) -> Expected: 401
- Test: handleWebhook(checkout.session.completed) -> Expected: profile updated to active
- Test: handleWebhook(customer.subscription.deleted) -> Expected: profile updated to canceled
- Test: handleWebhook(duplicate-event-id) -> Expected: 200, no duplicate processing
- Test: canShred(trialUser, 0 shreds) -> Expected: true
- Test: canShred(trialUser, 1 shred) -> Expected: false
- Test: canShred(activeSubscriber, 100 shreds) -> Expected: true
- Test: canShred(canceledUser, 0 shreds) -> Expected: false

## Integration Tests Required
- Test: POST /api/billing/checkout with auth -> Expected: 200, Stripe URL returned
- Test: POST /api/billing/checkout without auth -> Expected: 401
- Test: POST /api/billing/webhook with valid Stripe signature -> Expected: 200
- Test: POST /api/billing/webhook without signature -> Expected: 401
- Test: POST /api/billing/portal with auth -> Expected: 200, portal URL returned
- Test: Full cycle: checkout -> webhook -> profile updated -> user can shred

## E2E / Browser Tests Required
- Flow: Click Subscribe -> Stripe Checkout (test mode) -> Complete payment -> Redirected to dashboard -> Subscription status shows "Active"
- Flow: Dashboard shows correct plan name and status
- Flow: Pricing page displays all tiers correctly on desktop, tablet, mobile

## Security Tests Required
- Test: Forge webhook payload without valid signature -> Expected: 401
- Test: Manipulate client-side price data -> Expected: price set server-side via Stripe, manipulation has no effect
- Test: Access another user's billing portal -> Expected: denied (user can only access own)

## Edge Cases
- User completes checkout but webhook is delayed -> Expected: polling or eventual consistency
- User cancels mid-checkout -> Expected: no subscription created, no profile change
- Stripe is temporarily unreachable -> Expected: graceful error, user can retry
- User has past_due invoice -> Expected: shown appropriate message, can update payment method

## What "Done" Looks Like
A user clicks "Subscribe," completes Stripe Checkout with a test card, is redirected back to the dashboard which now shows "Solo Plan — Active," and can immediately shred unlimited RFPs. When they cancel via the portal, their access continues until period end, then stops.
