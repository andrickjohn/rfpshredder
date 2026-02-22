# Action Log Specification
# Stage 2 implementation: Supabase table (action_log)
# Every agent action logged, including blocked/failed actions.

## Fields
id (uuid), timestamp (timestamptz), agent (text), tier (int 1-4),
action (text), target (text), result (text), details (jsonb)

## Result values: success, failed, blocked, pending_approval, expired

## Example: Prospect scored
    timestamp:  2026-03-15T06:30:00Z
    agent:      prospect-hunter
    tier:       1
    action:     score_prospect
    target:     prospect-abc123
    result:     success
    details:    {"reachability":5, "intent":5, "decision_speed":5, "gate":"active_outreach"}

## Example: Tier 4 violation blocked
    timestamp:  2026-03-16T06:00:00Z
    agent:      prospect-hunter
    tier:       4
    action:     access_credentials
    target:     system
    result:     blocked
    details:    {"reason":"tier_4_action_attempted", "alert_sent":true}

## Rules
1. Completeness: every action logged, no exceptions
2. Immutability: agents write only, never modify/delete
3. No PII in details: prospect IDs only, not names/emails
4. Retention: 90 days
5. Indexes: timestamp, agent, action, result
