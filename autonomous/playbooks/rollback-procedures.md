# Rollback Procedures Playbook
# Window: 24 hours. Beyond: manual intervention.

## By Action Type
Emails sent: cannot unsend. Send correction/apology. Add to do-not-contact if appropriate.
Prospect scoring: re-score with corrected logic. If wrongly contacted, treat as email rollback.
Follow-up sequences: cancel pending, reassign to correct sequence.
Content published: delete/unpublish, post correction if inaccurate claims.
Database issues: Tier 4 (founder only), use Supabase point-in-time recovery.

## Emergency Rollback (Full Stop)
1. Activate emergency stop  2. All agents pause  3. All queued emails canceled
4. Review action log (last 24hrs)  5. Fix root cause  6. Reactivate one agent at a time
7. Monitor 24hrs before restoring normal autonomy

## Post-Rollback Checklist
- [ ] Root cause identified and documented
- [ ] Fix applied and tested
- [ ] Affected parties notified
- [ ] Action log updated with rollback entry
- [ ] LESSONS.md updated
- [ ] Safety boundaries reviewed
- [ ] Autonomy level reviewed
