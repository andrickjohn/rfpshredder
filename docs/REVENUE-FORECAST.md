# RFP Shredder — Revenue Forecast Model
# Path: docs/REVENUE-FORECAST.md
# Purpose: 12-month financial projection with assumptions and reconciliation instructions
# Created: Stage 1 Strategy Session
# Update frequency: Monthly (reconcile actuals), or when assumptions change
# Last updated: [DATE]

## Assumptions

| Assumption | Conservative | Baseline | Optimistic | Basis |
|---|---|---|---|---|
| Average selling price (monthly) | $99 | $130 | $165 | Solo $99 dominates; Baseline assumes 15% Team at $299; Optimistic adds Enterprise |
| Average customer lifetime (months) | 12 | 18 | 24 | SMB SaaS typical 12–24 months for sticky workflow tools |
| Monthly churn rate | 7% | 5% | 3% | SMB SaaS typical 3–7% |
| New customers/month (Month 1–3) | 4 | 8 | 14 | Conservative: founder-only outreach. Baseline: optimized outreach. Optimistic: early word-of-mouth |
| New customers/month (Month 4–6) | 7 | 12 | 20 | Baseline: agent-assisted + community traction |
| New customers/month (Month 7–12) | 10 | 15 | 25 | Baseline: content + partnerships + organic |
| Customer Acquisition Cost (CAC) | $225 | $175 | $125 | See CAC calculation below |
| Monthly infrastructure cost (launch) | $55 | $55 | $55 | Vercel Pro $20 + domain $1 + API ~$30 + buffer |
| Monthly infrastructure cost (Month 6) | $120 | $95 | $95 | Adds Supabase Pro, Sentry at $500 MRR |
| Monthly infrastructure cost (Month 12) | $250 | $180 | $180 | Adds monitoring, analytics at $2K MRR |

## CAC Calculation

For solo founders, CAC is primarily time:
- Founder hourly opportunity cost: $75/hr (adjusted from $50 default — GovCon domain expertise)
- Hours per acquired customer:
  - Research: 0.5 hrs (identify prospect on SAM.gov + LinkedIn)
  - Outreach: 0.3 hrs (personalize and send email/DM)
  - Follow-up: 0.5 hrs (2–3 follow-ups)
  - Demo/onboarding: 1.0 hrs (respond to questions, support trial)
  - Total: 2.3 hours per acquired customer
- CAC = 2.3 hrs × $75/hr = $172.50 ≈ $175

**Each customer costs approximately $175 to acquire, primarily in founder time (2.3 hours at $75/hr).**

CAC vs. revenue: $175 CAC / $130 ASP = 1.3 months to recover CAC. This is excellent.

## 12-Month Revenue Projection (BASELINE)

| Month | New Customers | Lost to Churn | Total Active | MRR | Cumulative Revenue | Monthly Costs | Monthly Net | Cumulative Net |
|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 0 | 6 | $780 | $780 | $55 | $725 | $725 |
| 2 | 8 | 0 | 14 | $1,820 | $2,600 | $55 | $1,765 | $2,490 |
| 3 | 8 | 1 | 21 | $2,730 | $5,330 | $95 | $2,635 | $5,125 |
| 4 | 10 | 1 | 30 | $3,900 | $9,230 | $95 | $3,805 | $8,930 |
| 5 | 12 | 2 | 40 | $5,200 | $14,430 | $95 | $5,105 | $14,035 |
| 6 | 12 | 2 | 50 | $6,500 | $20,930 | $120 | $6,380 | $20,415 |
| 7 | 14 | 3 | 61 | $7,930 | $28,860 | $120 | $7,810 | $28,225 |
| 8 | 14 | 3 | 72 | $9,360 | $38,220 | $120 | $9,240 | $37,465 |
| 9 | 15 | 4 | 83 | $10,790 | $49,010 | $150 | $10,640 | $48,105 |
| 10 | 15 | 4 | 94 | $12,220 | $61,230 | $150 | $12,070 | $60,175 |
| 11 | 15 | 5 | 104 | $13,520 | $74,750 | $180 | $13,340 | $73,515 |
| 12 | 15 | 5 | 114 | $14,820 | $89,570 | $180 | $14,640 | $88,155 |

Note: MRR uses blended ASP of $130 (85% Solo at $99 + 15% Team at $299). Churn applied as 5% of previous month total, rounded.

## Scenario Summary

| Metric | Conservative | Baseline | Optimistic |
|---|---|---|---|
| Month 6 MRR | $2,700 | $6,500 | $13,200 |
| Month 6 Total Customers | 27 | 50 | 80 |
| Month 12 MRR | $6,500 | $14,820 | $35,750 |
| Month 12 Total Customers | 65 | 114 | 215 |
| Cumulative Revenue (12 mo) | $42,800 | $89,570 | $198,000 |
| Cumulative Costs (12 mo) | $1,560 | $1,315 | $1,315 |
| Cumulative Profit/Loss (12 mo) | $41,240 | $88,255 | $196,685 |

## Unit Economics

| Metric | Value | Assessment |
|---|---|---|
| Customer Acquisition Cost (CAC) | $175 | Low for B2B SaaS — primarily founder time |
| Lifetime Value (LTV) | $2,340 | $130 ASP × 18 months average lifetime |
| LTV:CAC Ratio | 13.4:1 | Exceptional (target 3:1+) |
| Months to Recover CAC | 1.3 | Excellent — customer profitable in first 2 months |
| Break-even Month | 1 | First customer covers monthly infrastructure |
| Break-even Customer Count | 1 | $55 monthly cost / $130 ASP = 0.4 customers |

## "Worth Building?" Assessment

1. **Does the baseline scenario produce meaningful income within 6 months?** Yes. Month 6 MRR is $6,500 ($78K ARR). Even the Conservative scenario reaches $2,700 MRR by Month 6.

2. **Is the CAC sustainable?** Yes. At 2.3 hours per customer, the founder can acquire 3–4 customers per week while maintaining product and support. Agent-assisted outreach (Month 2+) reduces this further.

3. **Does LTV:CAC justify the effort?** Emphatically yes. 13.4:1 is exceptional. Even if actual LTV is half the projection (9 months instead of 18), the ratio is 6.7:1 — still excellent.

4. **What's the biggest financial risk?** Churn. If monthly churn is 10% instead of 5%, Month 12 MRR drops from $14,820 to approximately $9,500. Still profitable, but growth slows significantly. Mitigation: invest in accuracy (the #1 retention driver) and onboarding.

5. **Go/No-Go on the numbers**: GO. The unit economics are strong, break-even is immediate, and even the Conservative scenario produces a viable solo business. The product is worth building.

## Revenue-Driven Infrastructure Triggers

- $500 MRR (Month 2–3 baseline): Tier 2 justified — Supabase Pro, error monitoring
- $2,000 MRR (Month 3 baseline): Tier 3 justified — enhanced monitoring, analytics
- $5,000 MRR (Month 5 baseline): Begin SOC 2 planning
- Baseline hits $500 MRR in Month 1. Tier 2 can be introduced early.

## How to Update This Forecast

### Monthly Reconciliation Process
1. On the 1st of each month, fill in actual numbers next to projections
2. For any metric diverging >20% from baseline:
   a. Identify which assumption was wrong
   b. Update the assumption with actual data
   c. Re-project remaining months
3. Keep historical actuals — don't overwrite, add a new column

### Which Assumptions to Revise First
- If MRR is low: check new customers/month (acquisition issue) vs. churn (retention issue)
- If CAC is high: check hours per customer — is outreach taking longer than expected?
- If churn is high: check shreds/user (engagement) and support tickets (quality)
- If ASP is different: check mix of Solo vs. Team subscribers

### Template for Monthly Update

```markdown
## Month [X] Reconciliation — [Date]

| Metric | Forecast | Actual | Variance | Notes |
|---|---|---|---|---|
| New customers | X | X | +/-X% | |
| Churn | X | X | +/-X% | |
| Total active | X | X | +/-X% | |
| MRR | $X | $X | +/-X% | |
| CAC | $X | $X | +/-X% | |
| Infrastructure cost | $X | $X | +/-X% | |

### Assumptions Updated
- [assumption]: changed from [old] to [new] because [reason]

### Revised Projection (if needed)
- Month [X+1] MRR: $X (was $X)
- Month 12 MRR: $X (was $X)
```

## Changelog

| Date | Change | Reason |
|---|---|---|
| [Launch date] | Initial forecast created from Stage 1 analysis | — |
