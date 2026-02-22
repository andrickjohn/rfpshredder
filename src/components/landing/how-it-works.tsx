// src/components/landing/how-it-works.tsx
// Purpose: 3-step visual explanation of the product
// Dependencies: none

export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Upload your RFP',
      description: 'Drop your PDF or DOCX file. Supports documents up to 300 pages.',
    },
    {
      number: '2',
      title: 'AI extracts requirements',
      description: 'Every Section L instruction and Section M evaluation criterion is identified, classified by obligation level, and cross-referenced.',
    },
    {
      number: '3',
      title: 'Download your matrix',
      description: 'Get a formatted Excel compliance matrix ready for your proposal team. Color-coded, filterable, with compliance dropdowns.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          How it works
        </h2>
        <p className="mt-4 text-lg text-gray-500 text-center">
          Three steps. Two minutes. Zero requirements missed.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center text-2xl font-bold mx-auto">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
