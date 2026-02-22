# Test Specification: Landing Page
# Path: qa/test-specs/landing-page.md

## Acceptance Criteria
- [ ] All 10 sections from .claude/skills/landing-page.md are present
- [ ] Hero section: headline, subhead, CTA button, trust badge
- [ ] Pain section: addresses manual compliance matrix process
- [ ] How it works: 3-step visual explanation
- [ ] Comparison section: manual process vs. RFP Shredder table
- [ ] Security section: zero-retention architecture explained
- [ ] Pricing section: Free Trial, Solo ($99), Team (coming soon), Enterprise (contact)
- [ ] Social proof section: testimonial placeholders
- [ ] FAQ section: 6 questions answered
- [ ] Final CTA section
- [ ] Footer with links
- [ ] Page loads < 3 seconds on Fast 3G
- [ ] Lighthouse: Performance 80+, Accessibility 90+, SEO 80+, BP 80+
- [ ] Mobile responsive at all breakpoints
- [ ] All CTA buttons link to /signup
- [ ] No broken links

## E2E / Browser Tests Required
- Flow: Visit / -> All 10 sections visible -> Click CTA -> Navigates to /signup
- Flow: Scroll through entire page on mobile -> All content readable
- Viewport: desktop (1920x1080) — screenshot and verify layout
- Viewport: tablet (768x1024) — screenshot and verify layout
- Viewport: mobile (375x812) — screenshot and verify layout
- Performance: Lighthouse audit meets minimums

## Security Tests Required
- Test: Check all security headers present on / response
- Test: Check CSP header allows required resources (Stripe JS, Supabase)
- Test: Check no inline scripts without nonce (CSP compliance)

## Edge Cases
- JavaScript disabled -> Expected: content still readable (SSR)
- Slow connection (Fast 3G) -> Expected: meaningful content visible within 3 seconds
- Screen reader -> Expected: logical heading hierarchy, alt text on images, ARIA labels

## What "Done" Looks Like
A Proposal Manager visits the landing page, immediately understands what the product does (compliance matrix generation), sees the comparison to their manual process, reads the security section, views pricing, and clicks "Shred Your First RFP Free" — all within 60 seconds. The page is professional, fast, and works on their phone.
