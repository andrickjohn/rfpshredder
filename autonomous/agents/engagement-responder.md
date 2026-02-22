# Autonomous Agent: Engagement Responder
# Runs: Real-time (triggered) | Model: Claude Sonnet | Tier: 1/3
# Classifies replies: interested, security, price, not_now, not_interested, hostile
# Drafts response using reply-templates/, submits to approval queue (Tier 3 ALWAYS)
# Interested replies: flag urgent, target 4-hour response time
# Hostile: immediate founder alert, no auto-draft
# See Stage 1 Batch 12 for complete specification
