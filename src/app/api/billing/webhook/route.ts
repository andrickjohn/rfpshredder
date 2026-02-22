// src/app/api/billing/webhook/route.ts
// Purpose: Handle Stripe webhook events for subscription lifecycle
// Dependencies: stripe, supabase/admin, billing/subscription
// Test spec: qa/test-specs/billing.md
// SECURITY: Webhook signature verified on every request. Uses admin client (service role).

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyWebhookSignature,
  processWebhookEvent,
  isEventProcessed,
  markEventProcessed,
} from '@/lib/billing/subscription';
import { sendEmailAsync } from '@/lib/email/send';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    // 1. Read raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe webhook signature.' } },
        { status: 401 }
      );
    }

    // 2. Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(
        stripe,
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature.' } },
        { status: 401 }
      );
    }

    // 3. Idempotency check — skip duplicate events
    if (isEventProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    markEventProcessed(event.id);

    // 4. Process event with admin client (bypasses RLS)
    const supabase = createAdminClient();
    await processWebhookEvent(event, supabase);

    // 5. Send transactional emails (fire-and-forget, never blocks webhook response)
    await sendWebhookEmails(event, supabase);

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed.' } },
      { status: 500 }
    );
  }
}

/** Send transactional emails based on webhook event type */
async function sendWebhookEmails(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();
        if (profile?.email) {
          sendEmailAsync({
            to: profile.email,
            type: 'subscription_confirmation',
            data: { first_name: profile.full_name || 'there', plan_name: 'Solo' },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('stripe_customer_id', customerId)
          .single();
        if (profile?.email) {
          sendEmailAsync({
            to: profile.email,
            type: 'cancellation',
            data: { first_name: profile.full_name || 'there' },
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('stripe_customer_id', customerId)
          .single();
        if (profile?.email) {
          sendEmailAsync({
            to: profile.email,
            type: 'payment_failure',
            data: { first_name: profile.full_name || 'there' },
          });
        }
        break;
      }
    }
  } catch {
    // Email sending should never block webhook processing
  }
}
