// src/components/landing/hero.tsx
// Purpose: Hero section — headline, subhead, CTA, trust badge
// Dependencies: next/link

import Link from 'next/link';

export function Hero() {
  return (
    <section className="bg-navy text-white py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          Your compliance matrix.
          <br />
          <span className="text-brand-green">Done in 2 minutes.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Upload a federal RFP. Get a formatted Excel compliance matrix with every
          Section L and M requirement extracted, classified, and cross-referenced.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand-green hover:bg-brand-green-dark transition-colors rounded-lg shadow-lg shadow-brand-green/25"
          >
            Shred Your First RFP Free
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Zero document retention — your data never leaves your session</span>
        </div>
      </div>
    </section>
  );
}
