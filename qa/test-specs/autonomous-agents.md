# Test Specification: Autonomous Agent System
# Path: qa/test-specs/autonomous-agents.md

## Acceptance Criteria
- [ ] Tier 1 actions execute without approval
- [ ] Tier 2 actions execute and generate notification
- [ ] Tier 3 actions queue for approval and wait
- [ ] Tier 4 actions are blocked with immediate alert
- [ ] Safety boundaries enforced (email limits, cooldowns, scoring gates)
- [ ] Emergency stop halts all agent actions
- [ ] Action log records every agent action
- [ ] Daily digest generated and delivered at 08:00 ET
- [ ] Approval queue correctly handles approve/reject/defer/expire

## Unit Tests Required
- Test: classifyAction("research_prospect") -> Expected: tier 1
- Test: classifyAction("send_first_touch_email") -> Expected: tier 3
- Test: classifyAction("change_pricing") -> Expected: tier 4
- Test: enforceSafetyBoundary(51st_email_today) -> Expected: blocked
- Test: enforceSafetyBoundary(email_to_do_not_contact) -> Expected: blocked
- Test: triggerEmergencyStop() -> Expected: all agents paused, queues cleared

## Integration Tests Required
- Test: Tier 3 action submitted -> appears in approval queue -> approved -> executed
- Test: Tier 3 action submitted -> not acted on for 48 hours -> expired
- Test: Emergency stop triggered -> all agents verified paused
- Test: Action log query: count emails sent today -> returns correct count

## Security Tests Required
- Test: Agent attempts Tier 4 action -> blocked, alert generated
- Test: Agent attempts to modify safety-boundaries.yaml -> blocked
- Test: Agent attempts to modify autonomy-levels.yaml -> blocked

## What "Done" Looks Like
The autonomous system runs daily operations with appropriate guardrails. Tier 1 actions happen silently. Tier 2 actions appear in the daily digest. Tier 3 actions wait in the approval queue. Tier 4 actions are impossible. The founder spends ~25 minutes/day reviewing and approving.
