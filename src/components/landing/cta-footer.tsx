// src/components/landing/cta-footer.tsx
// Purpose: Final CTA section + footer
// Dependencies: next/link

import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-16 sm:py-20 bg-navy text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Stop spending days on compliance matrices
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          Upload your next RFP and get a formatted compliance matrix in 2 minutes.
          Your first shred is free — no credit card required.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand-green hover:bg-brand-green-dark transition-colors rounded-lg shadow-lg shadow-brand-green/25"
        >
          Shred Your First RFP Free
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-dark text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-3">RFP Shredder</h4>
            <p className="text-sm">
              AI-powered compliance matrix generation for government contractors.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Security</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} RFP Shredder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
