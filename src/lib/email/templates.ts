// src/lib/email/templates.ts
// Purpose: HTML email templates for transactional emails
// Dependencies: none
// Test spec: qa/test-specs/email-system.md
// Design: inline styles, max-width 600px, header #1B365D, CTA #10B981

export type EmailTemplate =
  | 'welcome'
  | 'trial_completion'
  | 'trial_nudge'
  | 'subscription_confirmation'
  | 'cancellation'
  | 'payment_failure';

export interface WelcomeData {
  first_name: string;
}

export interface TrialCompletionData {
  first_name: string;
  requirement_count: number;
  shall_count: number;
  page_count: number;
  processing_time_seconds: number;
}

export interface TrialNudgeData {
  first_name: string;
}

export interface SubscriptionConfirmationData {
  first_name: string;
  plan_name: string;
}

export interface CancellationData {
  first_name: string;
}

export interface PaymentFailureData {
  first_name: string;
}

export type TemplateData =
  | WelcomeData
  | TrialCompletionData
  | TrialNudgeData
  | SubscriptionConfirmationData
  | CancellationData
  | PaymentFailureData;

const HEADER_COLOR = '#1B365D';
const CTA_COLOR = '#10B981';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rfpshredder.com';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:${HEADER_COLOR};padding:24px 32px;">
<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">RFP Shredder</h1>
</td></tr>
<tr><td style="padding:32px;">
${content}
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
RFP Shredder — AI Compliance Matrix Generator<br>
<a href="${APP_URL}/unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${CTA_COLOR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;margin:16px 0;">${text}</a>`;
}

const templates: Record<EmailTemplate, (data: TemplateData) => { subject: string; html: string }> = {
  welcome: (data) => {
    const d = data as WelcomeData;
    return {
      subject: 'Welcome to RFP Shredder',
      html: layout(`
<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">Welcome, ${d.first_name}!</h2>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
You're all set to start shredding RFPs. Your free trial includes 1 complete RFP analysis — upload a PDF or DOCX and get a formatted Excel compliance matrix in about 2 minutes.
</p>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
Here's what you'll get:
</p>
<ul style="margin:0 0 16px;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
<li>Every Section L and M requirement extracted</li>
<li>7-level obligation classification (Shall, Must, Should, May...)</li>
<li>Automatic L-to-M cross-referencing</li>
<li>Color-coded, filterable Excel output</li>
</ul>
${ctaButton('Shred Your First RFP', `${APP_URL}/dashboard`)}
<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
Your document data is never stored — zero retention architecture.
</p>`),
    };
  },

  trial_completion: (data) => {
    const d = data as TrialCompletionData;
    return {
      subject: `${d.requirement_count} requirements extracted`,
      html: layout(`
<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">Your RFP has been shredded, ${d.first_name}!</h2>
<p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
Here's what we extracted:
</p>
<table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;margin:0 0 16px;">
<tr style="background:#f9fafb;"><td style="font-size:13px;color:#6b7280;">Requirements found</td><td style="font-size:13px;font-weight:bold;color:#1a1a1a;">${d.requirement_count}</td></tr>
<tr><td style="font-size:13px;color:#6b7280;">Shall/Must obligations</td><td style="font-size:13px;font-weight:bold;color:#1a1a1a;">${d.shall_count}</td></tr>
<tr style="background:#f9fafb;"><td style="font-size:13px;color:#6b7280;">Pages processed</td><td style="font-size:13px;font-weight:bold;color:#1a1a1a;">${d.page_count}</td></tr>
<tr><td style="font-size:13px;color:#6b7280;">Processing time</td><td style="font-size:13px;font-weight:bold;color:#1a1a1a;">${d.processing_time_seconds}s</td></tr>
</table>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
That's your free trial used up. Subscribe to the Solo plan ($99/month) for unlimited RFP shreds with up to 300 pages each.
</p>
${ctaButton('Subscribe — $99/month', `${APP_URL}/dashboard`)}
<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
All document content has been purged from our servers.
</p>`),
    };
  },

  trial_nudge: (data) => {
    const d = data as TrialNudgeData;
    return {
      subject: 'Your next RFP is waiting',
      html: layout(`
<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">Hi ${d.first_name},</h2>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
You tried RFP Shredder yesterday and saw how fast a compliance matrix can be built. The next RFP on your desk doesn't have to take 12-20 hours.
</p>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
Subscribe to Solo ($99/month) for unlimited shreds. That's less than an hour of a proposal manager's time.
</p>
${ctaButton('Subscribe Now', `${APP_URL}/dashboard`)}
<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
Cancel anytime. No long-term commitments.
</p>`),
    };
  },

  subscription_confirmation: (data) => {
    const d = data as SubscriptionConfirmationData;
    return {
      subject: `You're subscribed to RFP Shredder ${d.plan_name}`,
      html: layout(`
<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">Welcome aboard, ${d.first_name}!</h2>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
Your ${d.plan_name} plan is now active. You have unlimited access to RFP Shredder with documents up to 300 pages.
</p>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
Head to your dashboard to shred your next RFP.
</p>
${ctaButton('Go to Dashboard', `${APP_URL}/dashboard`)}
<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
Manage your subscription anytime from the billing portal in your dashboard.
</p>`),
    };
  },

  cancellation: (data) => {
    const d = data as CancellationData;
    return {
      subject: 'Your RFP Shredder subscription has been canceled',
      html: layout(`
<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">We're sorry to see you go, ${d.first_name}</h2>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
Your subscription has been canceled. You'll continue to have access until the end of your current billing period.
</p>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
If you change your mind, you can resubscribe anytime from your dashboard.
</p>
${ctaButton('Resubscribe', `${APP_URL}/dashboard`)}
<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
We'd love to hear your feedback — reply to this email to let us know how we can improve.
</p>`),
    };
  },

  payment_failure: (data) => {
    const d = data as PaymentFailureData;
    return {
      subject: 'Action required: Payment failed for RFP Shredder',
      html: layout(`
<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">Payment issue, ${d.first_name}</h2>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
We weren't able to process your latest payment. Please update your payment method to keep your subscription active.
</p>
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
Your access may be restricted until the payment is resolved.
</p>
${ctaButton('Update Payment Method', `${APP_URL}/dashboard`)}
<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
If you believe this is an error, please contact us.
</p>`),
    };
  },
};

/**
 * Get a rendered email template with personalized data.
 * Returns subject line and HTML body.
 */
export function getTemplate(
  templateName: EmailTemplate,
  data: TemplateData
): { subject: string; html: string } {
  const builder = templates[templateName];
  if (!builder) {
    throw new Error(`Unknown email template: ${templateName}`);
  }
  return builder(data);
}
