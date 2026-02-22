// src/components/landing/social-proof.tsx
// Purpose: Social proof / testimonial placeholders
// Dependencies: none

export function SocialProof() {
  const testimonials = [
    {
      quote: 'We used to spend two full days building our compliance matrix. Now it takes minutes. This changed how we approach proposals.',
      name: 'Proposal Manager',
      company: 'Mid-tier GovCon firm',
    },
    {
      quote: 'The obligation classification alone saves us hours of debate in kickoff meetings. Everyone sees the same requirements the same way.',
      name: 'Capture Manager',
      company: 'Federal IT services',
    },
    {
      quote: 'I was skeptical about the accuracy, but after testing with 5 RFPs we\'d already shredded manually, it caught requirements we\'d missed.',
      name: 'VP of Business Development',
      company: '$50M GovCon firm',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Trusted by proposal teams
        </h2>
        <p className="mt-4 text-lg text-gray-500 text-center">
          Join proposal managers who&apos;ve reclaimed their weekends.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                <p className="text-xs text-gray-400">{testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
