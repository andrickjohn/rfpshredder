// qa/tests/unit/email.test.ts
// Purpose: Unit tests for email templates and send function
// Test spec: qa/test-specs/email-system.md

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTemplate } from '@/lib/email/templates';
import type { EmailTemplate } from '@/lib/email/templates';

// ============================================================
// getTemplate — email template rendering
// ============================================================

describe('getTemplate', () => {
  describe('welcome template', () => {
    it('returns valid HTML with personalization', () => {
      const result = getTemplate('welcome', { first_name: 'Sarah' });
      expect(result.subject).toBe('Welcome to RFP Shredder');
      expect(result.html).toContain('Sarah');
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('RFP Shredder');
    });

    it('includes CTA button linking to dashboard', () => {
      const result = getTemplate('welcome', { first_name: 'John' });
      expect(result.html).toContain('/dashboard');
      expect(result.html).toContain('Shred Your First RFP');
    });

    it('includes unsubscribe link', () => {
      const result = getTemplate('welcome', { first_name: 'Test' });
      expect(result.html).toContain('Unsubscribe');
      expect(result.html).toContain('/unsubscribe');
    });
  });

  describe('trial_completion template', () => {
    it('returns valid HTML with stats', () => {
      const result = getTemplate('trial_completion', {
        first_name: 'Sarah',
        requirement_count: 47,
        shall_count: 15,
        page_count: 85,
        processing_time_seconds: 45,
      });
      expect(result.subject).toContain('47');
      expect(result.html).toContain('47');
      expect(result.html).toContain('15');
      expect(result.html).toContain('85');
      expect(result.html).toContain('45s');
      expect(result.html).toContain('Sarah');
    });

    it('includes subscribe CTA', () => {
      const result = getTemplate('trial_completion', {
        first_name: 'Test',
        requirement_count: 10,
        shall_count: 5,
        page_count: 20,
        processing_time_seconds: 10,
      });
      expect(result.html).toContain('$99/month');
    });
  });

  describe('trial_nudge template', () => {
    it('returns valid HTML with personalization', () => {
      const result = getTemplate('trial_nudge', { first_name: 'Mike' });
      expect(result.subject).toContain('waiting');
      expect(result.html).toContain('Mike');
      expect(result.html).toContain('Subscribe');
    });
  });

  describe('subscription_confirmation template', () => {
    it('includes plan name and welcome message', () => {
      const result = getTemplate('subscription_confirmation', {
        first_name: 'Sarah',
        plan_name: 'Solo',
      });
      expect(result.subject).toContain('Solo');
      expect(result.html).toContain('Solo');
      expect(result.html).toContain('Sarah');
      expect(result.html).toContain('unlimited');
    });
  });

  describe('cancellation template', () => {
    it('includes cancellation message and resubscribe CTA', () => {
      const result = getTemplate('cancellation', { first_name: 'Sarah' });
      expect(result.subject).toContain('canceled');
      expect(result.html).toContain('Sarah');
      expect(result.html).toContain('Resubscribe');
    });
  });

  describe('payment_failure template', () => {
    it('includes payment update CTA', () => {
      const result = getTemplate('payment_failure', { first_name: 'Sarah' });
      expect(result.subject).toContain('Payment failed');
      expect(result.html).toContain('Sarah');
      expect(result.html).toContain('Update Payment Method');
    });
  });

  describe('all templates', () => {
    const templateNames: EmailTemplate[] = [
      'welcome',
      'trial_completion',
      'trial_nudge',
      'subscription_confirmation',
      'cancellation',
      'payment_failure',
    ];

    const sampleData: Record<EmailTemplate, Record<string, unknown>> = {
      welcome: { first_name: 'Test' },
      trial_completion: {
        first_name: 'Test',
        requirement_count: 10,
        shall_count: 5,
        page_count: 20,
        processing_time_seconds: 10,
      },
      trial_nudge: { first_name: 'Test' },
      subscription_confirmation: { first_name: 'Test', plan_name: 'Solo' },
      cancellation: { first_name: 'Test' },
      payment_failure: { first_name: 'Test' },
    };

    it.each(templateNames)('%s template has required structure', (name) => {
      const result = getTemplate(name, sampleData[name] as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      // Must have subject
      expect(result.subject).toBeTruthy();
      expect(result.subject.length).toBeLessThanOrEqual(50);
      // Must have HTML with correct structure
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('RFP Shredder');
      expect(result.html).toContain('#1B365D'); // Header color
      expect(result.html).toContain('Unsubscribe');
    });
  });

  it('throws on unknown template', () => {
    expect(() => getTemplate('unknown_template' as any, { first_name: 'Test' })) // eslint-disable-line @typescript-eslint/no-explicit-any
      .toThrow('Unknown email template');
  });
});

// ============================================================
// sendEmail — Resend API wrapper
// ============================================================

// Mock Resend before importing send module
vi.mock('resend', () => {
  const mockSend = vi.fn();
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

describe('sendEmail', () => {
  let sendEmail: typeof import('@/lib/email/send').sendEmail;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const resendModule = await import('resend') as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    mockSend = resendModule.__mockSend;
    mockSend.mockReset();
    const sendModule = await import('@/lib/email/send');
    sendEmail = sendModule.sendEmail;
  });

  it('calls Resend API with correct parameters', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_123' }, error: null });

    const result = await sendEmail({
      to: 'test@example.com',
      type: 'welcome',
      data: { first_name: 'Sarah' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_123');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Welcome to RFP Shredder',
      })
    );
  });

  it('retries once on failure then succeeds', async () => {
    mockSend
      .mockResolvedValueOnce({ data: null, error: { message: 'Rate limited' } })
      .mockResolvedValueOnce({ data: { id: 'msg_456' }, error: null });

    const result = await sendEmail({
      to: 'test@example.com',
      type: 'welcome',
      data: { first_name: 'Sarah' },
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('returns failure after retry exhausted', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Service down' } });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await sendEmail({
      to: 'test@example.com',
      type: 'welcome',
      data: { first_name: 'Sarah' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Service down');
    expect(mockSend).toHaveBeenCalledTimes(2); // Original + 1 retry
    consoleSpy.mockRestore();
  });

  it('handles network errors gracefully', async () => {
    mockSend.mockRejectedValue(new Error('Network timeout'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await sendEmail({
      to: 'test@example.com',
      type: 'welcome',
      data: { first_name: 'Sarah' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network timeout');
    consoleSpy.mockRestore();
  });
});
