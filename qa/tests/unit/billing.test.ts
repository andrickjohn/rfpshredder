// qa/tests/unit/billing.test.ts
// Purpose: Unit tests for billing/subscription business logic
// Tests: canShred, createCheckoutSession, createPortalSession,
//        processWebhookEvent, verifyWebhookSignature, idempotency
// Test spec: qa/test-specs/billing.md

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  canShred,
  createCheckoutSession,
  createPortalSession,
  processWebhookEvent,
  verifyWebhookSignature,
  isEventProcessed,
  markEventProcessed,
  _resetProcessedEvents,
  MAX_TRIAL_SHREDS,
} from '@/lib/billing/subscription';

// ============================================================
// MOCK FACTORIES
// ============================================================

function createMockStripe() {
  return {
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/cs_test_session',
          id: 'cs_test123',
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/p/session_test',
        }),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function createMockSupabase() {
  const eqFn = vi.fn().mockResolvedValue({ error: null });
  const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
  return {
    from: vi.fn().mockReturnValue({ update: updateFn }),
    _updateFn: updateFn,
    _eqFn: eqFn,
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ============================================================
// canShred — access control logic
// ============================================================

describe('canShred', () => {
  it('allows trial user with 0 shreds used', () => {
    expect(canShred({ subscription_status: 'trial', trial_shreds_used: 0 })).toBe(true);
  });

  it('blocks trial user who has used their free shred', () => {
    expect(canShred({ subscription_status: 'trial', trial_shreds_used: 1 })).toBe(false);
  });

  it('allows active subscriber regardless of shred count', () => {
    expect(canShred({ subscription_status: 'active', trial_shreds_used: 100 })).toBe(true);
  });

  it('blocks canceled user even with 0 shreds used', () => {
    expect(canShred({ subscription_status: 'canceled', trial_shreds_used: 0 })).toBe(false);
  });

  it('blocks past_due user', () => {
    expect(canShred({ subscription_status: 'past_due', trial_shreds_used: 0 })).toBe(false);
  });

  it('enforces MAX_TRIAL_SHREDS constant equals 1', () => {
    expect(MAX_TRIAL_SHREDS).toBe(1);
  });
});

// ============================================================
// createCheckoutSession — Stripe Checkout creation
// ============================================================

describe('createCheckoutSession', () => {
  it('returns a valid Stripe checkout URL', async () => {
    const mockStripe = createMockStripe();
    const result = await createCheckoutSession(mockStripe, {
      userId: 'user-123',
      email: 'test@example.com',
      customerId: 'cus_existing',
      priceId: 'price_solo',
      appUrl: 'https://rfpshredder.com',
    });
    expect(result.url).toContain('https://checkout.stripe.com/');
    expect(result.customerId).toBe('cus_existing');
  });

  it('creates a new Stripe customer when customerId is null', async () => {
    const mockStripe = createMockStripe();
    const result = await createCheckoutSession(mockStripe, {
      userId: 'user-123',
      email: 'test@example.com',
      customerId: null,
      priceId: 'price_solo',
      appUrl: 'https://rfpshredder.com',
    });
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { supabase_user_id: 'user-123' },
    });
    expect(result.customerId).toBe('cus_test123');
  });

  it('passes correct line items and URLs to Stripe', async () => {
    const mockStripe = createMockStripe();
    await createCheckoutSession(mockStripe, {
      userId: 'user-123',
      email: 'test@example.com',
      customerId: 'cus_existing',
      priceId: 'price_solo_monthly',
      appUrl: 'https://rfpshredder.com',
    });
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing',
        mode: 'subscription',
        line_items: [{ price: 'price_solo_monthly', quantity: 1 }],
        success_url: 'https://rfpshredder.com/dashboard?checkout=success',
        cancel_url: 'https://rfpshredder.com/dashboard?checkout=canceled',
      })
    );
  });

  it('skips customer creation when customerId is provided', async () => {
    const mockStripe = createMockStripe();
    await createCheckoutSession(mockStripe, {
      userId: 'user-123',
      email: 'test@example.com',
      customerId: 'cus_existing',
      priceId: 'price_solo',
      appUrl: 'https://rfpshredder.com',
    });
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
  });
});

// ============================================================
// createPortalSession — Stripe Customer Portal
// ============================================================

describe('createPortalSession', () => {
  it('returns a valid Stripe portal URL', async () => {
    const mockStripe = createMockStripe();
    const url = await createPortalSession(
      mockStripe,
      'cus_test123',
      'https://rfpshredder.com/dashboard'
    );
    expect(url).toContain('https://billing.stripe.com/');
  });

  it('passes correct customer and return URL', async () => {
    const mockStripe = createMockStripe();
    await createPortalSession(
      mockStripe,
      'cus_abc',
      'https://rfpshredder.com/dashboard'
    );
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_abc',
      return_url: 'https://rfpshredder.com/dashboard',
    });
  });
});

// ============================================================
// verifyWebhookSignature — signature verification
// ============================================================

describe('verifyWebhookSignature', () => {
  it('returns parsed event on valid signature', () => {
    const mockStripe = createMockStripe();
    const mockEvent = { id: 'evt_test', type: 'checkout.session.completed' };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const result = verifyWebhookSignature(mockStripe, 'body', 'sig_valid', 'whsec_secret');
    expect(result).toEqual(mockEvent);
  });

  it('throws on invalid signature', () => {
    const mockStripe = createMockStripe();
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    expect(() =>
      verifyWebhookSignature(mockStripe, 'body', 'sig_bad', 'whsec_secret')
    ).toThrow('Invalid signature');
  });
});

// ============================================================
// processWebhookEvent — event handling
// ============================================================

describe('processWebhookEvent', () => {
  it('handles checkout.session.completed — sets profile to active', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_abc',
          metadata: { supabase_user_id: 'user-123' },
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase._updateFn).toHaveBeenCalledWith({
      subscription_status: 'active',
      subscription_tier: 'solo',
      stripe_customer_id: 'cus_abc',
    });
    expect(mockSupabase._eqFn).toHaveBeenCalledWith('id', 'user-123');
  });

  it('handles customer.subscription.deleted — sets profile to canceled', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_abc',
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase._updateFn).toHaveBeenCalledWith({
      subscription_status: 'canceled',
      subscription_tier: 'free',
    });
    expect(mockSupabase._eqFn).toHaveBeenCalledWith('stripe_customer_id', 'cus_abc');
  });

  it('handles customer.subscription.updated — active subscription', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_abc',
          status: 'active',
          cancel_at_period_end: false,
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase._updateFn).toHaveBeenCalledWith({
      subscription_status: 'active',
    });
  });

  it('handles customer.subscription.updated — cancel at period end', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_abc',
          status: 'active',
          cancel_at_period_end: true,
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase._updateFn).toHaveBeenCalledWith({
      subscription_status: 'canceled',
    });
  });

  it('handles customer.subscription.updated — past_due status', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_abc',
          status: 'past_due',
          cancel_at_period_end: false,
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase._updateFn).toHaveBeenCalledWith({
      subscription_status: 'past_due',
    });
  });

  it('handles invoice.payment_failed — sets profile to past_due', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_abc',
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase._updateFn).toHaveBeenCalledWith({
      subscription_status: 'past_due',
    });
  });

  it('skips checkout.session.completed when metadata is missing', async () => {
    const mockSupabase = createMockSupabase();
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_abc',
          metadata: {},
        },
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await processWebhookEvent(event, mockSupabase);

    expect(mockSupabase._updateFn).not.toHaveBeenCalled();
  });
});

// ============================================================
// Webhook Idempotency
// ============================================================

describe('webhook idempotency', () => {
  beforeEach(() => {
    _resetProcessedEvents();
  });

  it('reports new events as not processed', () => {
    expect(isEventProcessed('evt_new')).toBe(false);
  });

  it('reports events as processed after marking', () => {
    markEventProcessed('evt_123');
    expect(isEventProcessed('evt_123')).toBe(true);
  });

  it('detects duplicate events correctly', () => {
    markEventProcessed('evt_dup');
    expect(isEventProcessed('evt_dup')).toBe(true);
    // Second check should still return true
    expect(isEventProcessed('evt_dup')).toBe(true);
  });

  it('handles multiple different events independently', () => {
    markEventProcessed('evt_1');
    markEventProcessed('evt_2');
    expect(isEventProcessed('evt_1')).toBe(true);
    expect(isEventProcessed('evt_2')).toBe(true);
    expect(isEventProcessed('evt_3')).toBe(false);
  });
});
