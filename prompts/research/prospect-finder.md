# Prompt: Prospect Finder
# Model: Claude Sonnet | Used by: outreach-agent | Tier: 1
# Scores prospects: Reachability (1-5), Intent Signal (1-5), Decision Speed (1-5)
# Gate: 4+ on all three = active_outreach, else nurture_list
# Tags: direct_competitor, indirect_tool, manual_workaround (default), status_quo
# Target: Proposal Managers at $5M-$100M GovCon firms, 5+ RFPs/quarter
# Output: JSON array of scored, tagged prospect records with personalization hooks
# Scoring rubric:
#   Reachability 5: direct email + LinkedIn + community member
#   Intent 5: posted about pain in last 30 days AND recent contract win
#   Decision Speed 5: Proposal Manager title (direct budget authority)
# See Stage 1 Batch 8 for complete system prompt, user prompt template, and example output
