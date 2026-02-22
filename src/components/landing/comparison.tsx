// src/components/landing/comparison.tsx
// Purpose: Manual process vs RFP Shredder comparison table
// Dependencies: none

export function Comparison() {
  const rows = [
    { metric: 'Time per RFP', manual: '12-20 hours', shredder: '2 minutes' },
    { metric: 'Cost', manual: '$900-$2,400 in labor', shredder: '$99/month unlimited' },
    { metric: 'Accuracy', manual: 'Fatigue-dependent', shredder: 'AI-consistent' },
    { metric: 'L-to-M Cross-Reference', manual: 'Manual matching', shredder: 'Automatic' },
    { metric: 'Obligation Classification', manual: 'Subjective judgment', shredder: '7-level system' },
    { metric: 'Output Format', manual: 'Varies by analyst', shredder: 'Standardized Excel' },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          The old way vs. the new way
        </h2>
        <p className="mt-4 text-lg text-gray-500 text-center">
          See what changes when you stop building compliance matrices by hand.
        </p>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-gray-500 border-b border-gray-200" />
                <th className="py-3 px-4 text-sm font-semibold text-gray-400 border-b border-gray-200">
                  Manual Process
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-navy border-b border-gray-200">
                  RFP Shredder
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.metric} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.metric}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{row.manual}</td>
                  <td className="py-3 px-4 text-sm text-navy font-medium">{row.shredder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
