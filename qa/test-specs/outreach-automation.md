# Test Specification: Outreach Automation
# Path: qa/test-specs/outreach-automation.md
# Note: Outreach system is built in Stage 2 but DORMANT until 10+ manual conversions

## Acceptance Criteria
- [ ] Prospect scoring produces Reachability, Intent, Decision Speed (1-5 each)
- [ ] Prospects scoring 4+ on all three enter active_outreach queue
- [ ] Prospects below 4 on any dimension go to nurture list with logged reason
- [ ] Every prospect is tagged with current_alternative
- [ ] Email templates are selected based on current_alternative tag
- [ ] First-touch emails require Tier 3 approval
- [ ] Follow-up emails are Tier 2 (auto-send with notification)
- [ ] Maximum 50 emails/day enforced
- [ ] Maximum 3 follow-ups per prospect enforced
- [ ] 48-hour cooldown between emails enforced
- [ ] Unsubscribe link in every email
- [ ] Do-not-contact list checked before every outreach action

## Unit Tests Required
- Test: scoreProspect(high-quality-data) -> Expected: scores 4+ on all dimensions
- Test: scoreProspect(low-intent-data) -> Expected: intent below 4, gate result "nurture"
- Test: tagAlternative(deltek-evidence) -> Expected: "direct_competitor"
- Test: tagAlternative(no-evidence) -> Expected: "manual_workaround" (default)
- Test: selectTemplate("manual_workaround") -> Expected: manual-workaround.md template
- Test: checkCooldown(last_email_20_hours_ago) -> Expected: false (not met)
- Test: checkCooldown(last_email_50_hours_ago) -> Expected: true (met)
- Test: checkDoNotContact(blocked_email) -> Expected: true (blocked)

## Integration Tests Required
- Test: Full pipeline: discover -> score -> gate -> tag -> draft email -> queue for approval
- Test: Approval -> send -> log in action log
- Test: Rejection -> cancel -> log rejection reason
- Test: Daily email count at 50 -> next email blocked with "DAILY_LIMIT_REACHED"

## Security Tests Required
- Test: Prospect PII is hashed in action logs (no raw email addresses in logs)
- Test: Do-not-contact list cannot be bypassed by any agent action
- Test: Tier 4 actions (financial, legal) are blocked with alert

## What "Done" Looks Like
The outreach system discovers prospects, scores them, filters out unqualified leads, tags their current alternative, selects the right email template, and queues personalized emails for founder approval. Safety boundaries are enforced at every step.
