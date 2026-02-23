// src/components/dashboard/stats-cards.tsx
// Purpose: Aggregate metrics display — shreds, requirements, time saved
// Dependencies: none (pure presentational)

interface StatsCardsProps {
  totalShreds: number;
  totalRequirements: number;
  timeSavedHours: number;
}

export function StatsCards({ totalShreds, totalRequirements, timeSavedHours }: StatsCardsProps) {
  const cards = [
    {
      label: 'RFPs Shredded',
      value: totalShreds.toLocaleString(),
      bgColor: 'bg-blue-50',
      iconColor: 'text-[#1B365D]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      label: 'Requirements Extracted',
      value: totalRequirements.toLocaleString(),
      bgColor: 'bg-green-50',
      iconColor: 'text-[#10B981]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      label: 'Hours Saved (est.)',
      value: timeSavedHours.toLocaleString(),
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center ${card.iconColor}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
