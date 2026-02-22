// src/lib/billing/stripe.ts
// Purpose: Stripe client initialization
// Dependencies: stripe
// Test spec: qa/test-specs/billing.md
// SECURITY: STRIPE_SECRET_KEY from env var only — never hardcoded

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
