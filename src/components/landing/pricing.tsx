// src/components/landing/pricing.tsx
// Purpose: Pricing cards — Free Trial, Solo, Enterprise
// Dependencies: next/link

import Link from 'next/link';

export function Pricing() {
  return (
    <section id="pricing" className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-gray-500 text-center">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Trial */}
          <div className="rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900">Free Trial</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">$0</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Try it before you buy it</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check /> 1 RFP shred
              </li>
              <li className="flex items-center gap-2">
                <Check /> Up to 100 pages
              </li>
              <li className="flex items-center gap-2">
                <Check /> Full Excel compliance matrix
              </li>
              <li className="flex items-center gap-2">
                <Check /> L-to-M cross-reference
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block w-full text-center py-3 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Solo — highlighted */}
          <div className="rounded-xl border-2 border-brand-green p-8 relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-brand-green text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Solo</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">$99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">For individual proposal managers</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check /> Unlimited RFP shreds
              </li>
              <li className="flex items-center gap-2">
                <Check /> Up to 300 pages per RFP
              </li>
              <li className="flex items-center gap-2">
                <Check /> Full Excel compliance matrix
              </li>
              <li className="flex items-center gap-2">
                <Check /> L-to-M cross-reference
              </li>
              <li className="flex items-center gap-2">
                <Check /> 7-level obligation classification
              </li>
              <li className="flex items-center gap-2">
                <Check /> Priority support
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block w-full text-center py-3 px-4 rounded-lg bg-brand-green text-white text-sm font-medium hover:bg-brand-green-dark transition-colors shadow-sm"
            >
              Subscribe — $99/month
            </Link>
          </div>

          {/* Enterprise */}
          <div className="rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">Custom</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">For proposal teams and organizations</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check /> Everything in Solo
              </li>
              <li className="flex items-center gap-2">
                <Check /> Team collaboration
              </li>
              <li className="flex items-center gap-2">
                <Check /> Custom integrations
              </li>
              <li className="flex items-center gap-2">
                <Check /> Dedicated support
              </li>
              <li className="flex items-center gap-2">
                <Check /> Volume pricing
              </li>
            </ul>
            <a
              href="mailto:hello@rfpshredder.com"
              className="mt-8 block w-full text-center py-3 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
