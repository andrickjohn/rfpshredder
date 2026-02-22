# Claude Code — Master Context
# Path: .claude/claude.md
# Purpose: Primary context file that Claude Code reads before any task

## You Are Building: RFP Shredder
An AI-powered compliance matrix generator for government contractors.
Upload an RFP (PDF/DOCX) -> formatted Excel compliance matrix in 2 minutes.

## Critical Context — Read These First
1. /claude.md (root) — Full Stage 2 build brief
2. /qa/QA-STRATEGY.md — Testing philosophy and protocols
3. /qa/test-specs/[component].md — Test spec for what you're building
4. /docs/architecture/system-overview.md — System architecture
5. /docs/architecture/security-model.md — Zero-retention security model

## Non-Negotiable Rules
1. ZERO DOCUMENT RETENTION. Never store uploaded content anywhere persistent.
2. TEST BEFORE DONE. Every component passes its test spec before moving on.
3. FREE TIER FIRST. Only paid service: Vercel Pro ($20/mo).
4. SELF-CORRECT BEFORE ESCALATING. Max 3 fix attempts, then escalate.
5. SCOPE LOCKS ARE PERMANENT. MVP = L/M extraction only. No ghost reqs, no amendments.

## Reference Files
- Coding standards: .claude/rules/coding-standards.md
- Security rules: .claude/rules/security-rules.md
- Output standards: .claude/rules/output-standards.md
- Autonomy boundaries: .claude/rules/autonomy-boundaries.md
- API development: .claude/skills/api-development.md
- Landing page: .claude/skills/landing-page.md
- Email automation: .claude/skills/email-automation.md
- Data analysis: .claude/skills/data-analysis.md
