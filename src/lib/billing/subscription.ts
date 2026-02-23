// src/lib/billing/subscription.ts
// Purpose: Billing business logic — access control, checkout, portal, webhook handling
// Dependencies: stripe (type-only for function signatures)
// Test spec: qa/test-specs/billing.md

import type Stripe from 'stripe';

// ============================================================
// ACCESS CONTROL
// ============================================================

export interface SubscriptionProfile {
  subscription_status: string;
  trial_shreds_used: number;
}

/** Maximum number of free shreds before subscription is required */
export const MAX_TRIAL_SHREDS = 1;

/**
 * Check if a user is allowed to shred an RFP based on their subscription status.
 * Trial users: limited to MAX_TRIAL_SHREDS (1).
 * Active subscribers: unlimited.
 * Canceled/past_due: no access.
 */
export function canShred(profile: SubscriptionProfile): boolean {
  switch (profile.subscription_status) {
    case 'active':
      return true;
    case 'trial':
      return profile.trial_shreds_used < MAX_TRIAL_SHREDS;
    case 'canceled':
    case 'past_due':
    default:
      return false;
  }
}

// ============================================================
// CHECKOUT SESSION
// ============================================================

export interface CheckoutParams {
  userId: string;
  email: string;
  customerId: string | null;
  priceId: string;
  appUrl: string;
}

/**
 * Create a Stripe Checkout session for the Solo plan.
 * Creates a Stripe customer if one doesn't exist.
 */
export async function createCheckoutSession(
  stripeClient: Stripe,
  params: CheckoutParams
): Promise<{ url: string; customerId: string }> {
  let { customerId } = params;

  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email: params.email,
      metadata: { supabase_user_id: params.userId },
    });
    customerId = customer.id;
  }

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: `${params.appUrl}/dashboard?checkout=success`,
    cancel_url: `${params.appUrl}/dashboard?checkout=canceled`,
    metadata: { supabase_user_id: params.userId },
  });

  return { url: session.url!, customerId };
}

// ============================================================
// CUSTOMER PORTAL
// ============================================================

/**
 * Create a Stripe Customer Portal session for managing subscriptions.
 */
export async function createPortalSession(
  stripeClient: Stripe,
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// ============================================================
// WEBHOOK EVENT PROCESSING
// ============================================================

/** Supabase client interface for webhook handlers (admin client) */
interface WebhookSupabaseClient {
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): PromiseLike<{ error: unknown }>;
    };
  };
}

/**
 * Process a verified Stripe webhook event and update the database.
 * Uses the admin (service role) Supabase client to bypass RLS.
 */
export async function processWebhookEvent(
  event: Stripe.Event,
  supabase: WebhookSupabaseClient
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_tier: 'solo',
        stripe_customer_id: session.customer as string,
      }).eq('id', userId);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      let status: string;
      if (subscription.status === 'past_due') {
        status = 'past_due';
      } else if (subscription.cancel_at_period_end) {
        status = 'canceled';
      } else {
        status = 'active';
      }
      await supabase.from('profiles').update({
        subscription_status: status,
      }).eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await supabase.from('profiles').update({
        subscription_status: 'canceled',
        subscription_tier: 'free',
      }).eq('stripe_customer_id', customerId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('stripe_customer_id', customerId);
      break;
    }
  }
}

// ============================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================

/**
 * Verify a Stripe webhook signature and return the parsed event.
 * Throws if the signature is invalid.
 */
export function verifyWebhookSignature(
  stripeClient: Stripe,
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripeClient.webhooks.constructEvent(body, signature, secret);
}

// ============================================================
// WEBHOOK IDEMPOTENCY (in-memory for MVP)
// ============================================================

const processedEventIds = new Set<string>();
const MAX_PROCESSED_EVENTS = 1000;

/** Check if a webhook event has already been processed */
export function isEventProcessed(eventId: string): boolean {
  return processedEventIds.has(eventId);
}

/** Mark a webhook event as processed */
export function markEventProcessed(eventId: string): void {
  processedEventIds.add(eventId);
  // Prevent memory leak — evict oldest half when limit reached
  if (processedEventIds.size > MAX_PROCESSED_EVENTS) {
    const iterator = processedEventIds.values();
    for (let i = 0; i < MAX_PROCESSED_EVENTS / 2; i++) {
      const val = iterator.next().value;
      if (val !== undefined) processedEventIds.delete(val);
    }
  }
}

/** Reset processed events — for testing only */
export function _resetProcessedEvents(): void {
  processedEventIds.clear();
}
