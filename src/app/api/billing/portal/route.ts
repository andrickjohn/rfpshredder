// src/app/api/billing/portal/route.ts
// Purpose: Create Stripe Customer Portal session for subscription management
// Dependencies: stripe, supabase/server, rate-limit, billing/subscription
// Test spec: qa/test-specs/billing.md
// SECURITY: Auth required, user can only access own billing portal

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { stripe } from '@/lib/billing/stripe';
import { createPortalSession } from '@/lib/billing/subscription';

export async function POST() {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Please sign in.' } },
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

    // 3. Get Stripe customer ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found. Please subscribe first.' } },
        { status: 400 }
      );
    }

    // 4. Create portal session
    const url = await createPortalSession(
      stripe,
      profile.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'PORTAL_ERROR', message: 'Unable to open billing portal. Please try again.' } },
      { status: 500 }
    );
  }
}
