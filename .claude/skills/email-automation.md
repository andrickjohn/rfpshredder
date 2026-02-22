# Skill: Email Automation — Path: .claude/skills/email-automation.md
# Provider: Resend. Simple HTML templates (inline styles, no images, max-width 600px).
# Triggers: signup->welcome, trial shred->completion stats, 24hr no sub->nudge,
# stripe sub->confirmation, cancel->cancellation, payment fail->alert
# Centralized sender: src/lib/email/send.ts. Retry once on failure. Don't block user flow.
# Colors: header #1B365D, CTA button #10B981. Keep emails 2-4 short paragraphs.
