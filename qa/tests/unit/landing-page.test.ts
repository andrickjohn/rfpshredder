// qa/tests/unit/landing-page.test.ts
// Purpose: Verify landing page components export correctly and are importable
// Note: Full visual/layout testing done via E2E (Playwright) per Lesson 2 (no jsdom)
// Test spec: qa/test-specs/landing-page.md

import { describe, it, expect } from 'vitest';

describe('landing page components', () => {
  it('exports Navbar component', async () => {
    const mod = await import('@/components/landing/navbar');
    expect(mod.Navbar).toBeDefined();
    expect(typeof mod.Navbar).toBe('function');
  });

  it('exports Hero component', async () => {
    const mod = await import('@/components/landing/hero');
    expect(mod.Hero).toBeDefined();
    expect(typeof mod.Hero).toBe('function');
  });

  it('exports Pain component', async () => {
    const mod = await import('@/components/landing/pain');
    expect(mod.Pain).toBeDefined();
    expect(typeof mod.Pain).toBe('function');
  });

  it('exports HowItWorks component', async () => {
    const mod = await import('@/components/landing/how-it-works');
    expect(mod.HowItWorks).toBeDefined();
    expect(typeof mod.HowItWorks).toBe('function');
  });

  it('exports Comparison component', async () => {
    const mod = await import('@/components/landing/comparison');
    expect(mod.Comparison).toBeDefined();
    expect(typeof mod.Comparison).toBe('function');
  });

  it('exports Security component', async () => {
    const mod = await import('@/components/landing/security');
    expect(mod.Security).toBeDefined();
    expect(typeof mod.Security).toBe('function');
  });

  it('exports Pricing component', async () => {
    const mod = await import('@/components/landing/pricing');
    expect(mod.Pricing).toBeDefined();
    expect(typeof mod.Pricing).toBe('function');
  });

  it('exports SocialProof component', async () => {
    const mod = await import('@/components/landing/social-proof');
    expect(mod.SocialProof).toBeDefined();
    expect(typeof mod.SocialProof).toBe('function');
  });

  it('exports FAQ component', async () => {
    const mod = await import('@/components/landing/faq');
    expect(mod.FAQ).toBeDefined();
    expect(typeof mod.FAQ).toBe('function');
  });

  it('exports FinalCTA and Footer components', async () => {
    const mod = await import('@/components/landing/cta-footer');
    expect(mod.FinalCTA).toBeDefined();
    expect(mod.Footer).toBeDefined();
    expect(typeof mod.FinalCTA).toBe('function');
    expect(typeof mod.Footer).toBe('function');
  });

  it('all 10 required sections are available', async () => {
    // Per .claude/skills/landing-page.md: 10 sections required
    const sections = [
      import('@/components/landing/hero'),           // 1. Hero
      import('@/components/landing/pain'),            // 2. Pain Statement
      import('@/components/landing/how-it-works'),    // 3. How It Works
      import('@/components/landing/comparison'),      // 4. Comparison
      import('@/components/landing/security'),        // 5. Security
      import('@/components/landing/pricing'),         // 6. Pricing
      import('@/components/landing/social-proof'),    // 7. Social Proof
      import('@/components/landing/faq'),             // 8. FAQ
      import('@/components/landing/cta-footer'),      // 9. Final CTA + 10. Footer
    ];
    const results = await Promise.all(sections);
    results.forEach((mod) => {
      expect(Object.keys(mod).length).toBeGreaterThan(0);
    });
  });
});
