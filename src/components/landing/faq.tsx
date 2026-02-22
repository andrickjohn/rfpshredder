// src/components/landing/faq.tsx
// Purpose: FAQ section with expandable questions
// Dependencies: react (Client Component for interactivity)

'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What types of RFPs does this work with?',
    answer: 'RFP Shredder works with standard federal RFPs that have Section L (Instructions to Offerors) and Section M (Evaluation Criteria). It supports PDF and DOCX formats up to 300 pages.',
  },
  {
    question: 'How accurate is the extraction?',
    answer: 'Our AI extraction achieves 95%+ recall on standard digital PDFs. Every requirement is classified using a 7-level obligation system (shall, must, should, may, will, is required to, is expected to) and cross-referenced between Sections L and M.',
  },
  {
    question: 'Is my document data secure?',
    answer: 'Absolutely. We use a zero-retention architecture. Your document is processed in memory and immediately purged — nothing is ever stored on our servers, in databases, or in logs. All data is encrypted in transit with TLS.',
  },
  {
    question: 'What does the free trial include?',
    answer: 'The free trial gives you 1 complete RFP shred (up to 100 pages) with the full Excel compliance matrix output, including obligation classification and L-to-M cross-referencing. No credit card required.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes. You can cancel anytime through the billing portal. Your subscription remains active until the end of your current billing period — no prorated refunds, but no surprise charges either.',
  },
  {
    question: 'Do you support scanned PDFs?',
    answer: 'Currently, RFP Shredder works best with digital (text-based) PDFs. OCR support for scanned documents is on our roadmap. Most federal RFPs distributed through SAM.gov and agency portals are digital PDFs.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Frequently asked questions
        </h2>
        <div className="mt-12 divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="py-4">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex justify-between items-center text-left"
                aria-expanded={openIndex === index}
              >
                <span className="text-base font-medium text-gray-900 pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
