# Test Specification: Email System
# Path: qa/test-specs/email-system.md

## Acceptance Criteria
- [ ] Welcome email sends on signup
- [ ] Trial completion email sends after free shred (with stats)
- [ ] Trial nudge email sends 24 hours after trial if not subscribed
- [ ] Subscription confirmation email sends on checkout.session.completed
- [ ] Cancellation email sends on customer.subscription.deleted
- [ ] Payment failure email sends on invoice.payment_failed
- [ ] All emails render correctly in major email clients
- [ ] All emails contain unsubscribe mechanism
- [ ] All emails use correct sender domain
- [ ] No PII beyond email address in email logs

## Unit Tests Required
- Test: getTemplate("welcome", {first_name: "Sarah"}) -> Expected: valid HTML with personalization
- Test: getTemplate("trial_completion", {requirement_count: 47, shall_count: 15}) -> Expected: valid HTML with stats
- Test: sendEmail({to, type, data}) -> Expected: Resend API called with correct params
- Test: sendEmail with Resend error -> Expected: retry once, then log failure

## Integration Tests Required
- Test: Trigger signup -> Verify welcome email sent via Resend API
- Test: Trigger trial shred completion -> Verify trial completion email with correct stats
- Test: Trigger Stripe webhook (subscription created) -> Verify confirmation email
- Test: Trigger Stripe webhook (subscription deleted) -> Verify cancellation email

## Edge Cases
- Resend API is down -> Expected: email queued for retry, user flow not blocked
- User email bounces -> Expected: logged, no retry spam
- User signs up and immediately subscribes (within 30 seconds) -> Expected: welcome + confirmation, no trial nudge

## What "Done" Looks Like
Every transactional email fires at the right time with the right content. Emails are simple, professional, and render correctly. The founder can see email delivery status in the Resend dashboard.
