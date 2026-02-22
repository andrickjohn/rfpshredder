// src/components/landing/pain.tsx
// Purpose: Pain statement section — addresses manual compliance matrix process
// Dependencies: none

export function Pain() {
  const painPoints = [
    {
      title: '12-20 hours per RFP',
      description: 'Reading every page, hunting for requirements hidden across Section L and M.',
    },
    {
      title: 'Copy-paste into spreadsheets',
      description: 'Manually transferring each requirement into Excel, hoping nothing gets missed.',
    },
    {
      title: 'Cross-reference guesswork',
      description: 'Matching evaluation criteria to instructions by hand, with no margin for error.',
    },
    {
      title: 'Fatigue-driven mistakes',
      description: 'By hour 10, you\'re missing "shall" statements that could cost you the win.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Still building compliance matrices by hand?
        </h2>
        <p className="mt-4 text-lg text-gray-500 text-center max-w-2xl mx-auto">
          Every proposal manager knows the drill. It&apos;s tedious, error-prone,
          and eats into the time you need for writing a winning response.
        </p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {painPoints.map((point) => (
            <div key={point.title} className="flex gap-3 p-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500 text-xs font-bold">&times;</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{point.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
