// src/app/api/billing/checkout/route.ts
// Purpose: Create Stripe Checkout session for Solo plan subscription
// Dependencies: stripe, supabase/server, rate-limit, billing/subscription
// Test spec: qa/test-specs/billing.md
// SECURITY: Auth required, rate limited, price set server-side (never trust client)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { stripe } from '@/lib/billing/stripe';
import { createCheckoutSession } from '@/lib/billing/subscription';

export async function POST() {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Please sign in to subscribe.' } },
        { status: 401 }
      );
    }

    // 2. Rate limit
    const rateResult = checkRateLimit(user.id, RATE_LIMITS.billing);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' } },
        { status: 429 }
      );
    }

    // 3. Get profile for existing Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    // 4. Create checkout session (creates Stripe customer if needed)
    const { url, customerId } = await createCheckoutSession(stripe, {
      userId: user.id,
      email: user.email!,
      customerId: profile?.stripe_customer_id ?? null,
      priceId: process.env.STRIPE_PRICE_SOLO_MONTHLY!,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    });

    // 5. Store Stripe customer ID if newly created
    if (!profile?.stripe_customer_id) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: { code: 'CHECKOUT_ERROR', message: 'Unable to create checkout session. Please try again.' } },
      { status: 500 }
    );
  }
}
