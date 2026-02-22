# Approval Queue Specification
# Stage 2 implementation: Supabase table + /app/approvals dashboard page
# Item fields: id, submitted_at, submitted_by, action_type, urgency, expires_at,
# target (type/name/company/email), context (scores/tag/signal/quality),
# proposed_action (type/subject/body/template), risk_assessment, recommended_decision
# Founder actions: approve, approve_with_edits, reject (reason required), defer (max 3), expire (48hr)
# FIFO with urgency override. Edits logged for agent learning.
# See Stage 1 Batch 13 for complete YAML schema and example
