// src/components/landing/security.tsx
// Purpose: Zero-retention security section
// Dependencies: none

export function Security() {
  const features = [
    {
      title: 'Zero document retention',
      description: 'Your RFP is processed in memory and immediately purged. Nothing is stored on our servers.',
    },
    {
      title: 'Encrypted in transit',
      description: 'All data is encrypted with TLS. Strict transport security headers enforced.',
    },
    {
      title: 'No third-party storage',
      description: 'Documents never touch S3, databases, or persistent storage of any kind.',
    },
    {
      title: 'SOC 2 infrastructure',
      description: 'Built on Vercel and Supabase — enterprise-grade infrastructure with SOC 2 compliance.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Your data never leaves your session
        </h2>
        <p className="mt-4 text-lg text-gray-500 text-center max-w-2xl mx-auto">
          We built RFP Shredder with a zero-retention architecture. Your sensitive
          procurement documents are processed and immediately purged.
        </p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
