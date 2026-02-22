// src/app/page.tsx
// Purpose: Landing page — 10 sections per .claude/skills/landing-page.md
// Dependencies: All landing page section components
// Test spec: qa/test-specs/landing-page.md

import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Pain } from '@/components/landing/pain';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Comparison } from '@/components/landing/comparison';
import { Security } from '@/components/landing/security';
import { Pricing } from '@/components/landing/pricing';
import { SocialProof } from '@/components/landing/social-proof';
import { FAQ } from '@/components/landing/faq';
import { FinalCTA, Footer } from '@/components/landing/cta-footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Pain />
        <HowItWorks />
        <Comparison />
        <Security />
        <Pricing />
        <SocialProof />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
