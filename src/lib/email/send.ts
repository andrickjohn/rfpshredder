// src/lib/email/send.ts
// Purpose: Centralized email sender via Resend API
// Dependencies: resend
// Test spec: qa/test-specs/email-system.md
// SECURITY: No PII beyond email address in logs. Don't block user flow on failure.

import { Resend } from 'resend';
import { getTemplate } from './templates';
import type { EmailTemplate, TemplateData } from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@rfpshredder.com';

export interface SendEmailParams {
  to: string;
  type: EmailTemplate;
  data: TemplateData;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a transactional email via Resend.
 * Retries once on failure. Never blocks the user flow.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, type, data } = params;

  let template;
  try {
    template = getTemplate(type, data);
  } catch (error) {
    return {
      success: false,
      error: `Template error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }

  // Attempt 1
  const result = await attemptSend(to, template.subject, template.html);
  if (result.success) return result;

  // Retry once on failure
  const retryResult = await attemptSend(to, template.subject, template.html);
  if (retryResult.success) return retryResult;

  // Log failure (no PII beyond email address)
  console.error(`[EMAIL] Failed to send ${type} to ${to}: ${retryResult.error}`);
  return retryResult;
}

async function attemptSend(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Send email without awaiting — fire and forget.
 * Use this to avoid blocking user-facing operations.
 */
export function sendEmailAsync(params: SendEmailParams): void {
  sendEmail(params).catch(() => {
    // Swallow — already logged inside sendEmail
  });
}
