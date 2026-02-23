// src/components/dashboard/trust-banner.tsx
// Purpose: Zero document retention trust badge for dashboard
// Dependencies: none (pure presentational)

export function TrustBanner() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">Zero Document Retention</p>
        <p className="text-xs text-gray-600">
          Your RFP is processed in memory and immediately purged after download. Nothing is ever stored on our servers.
        </p>
      </div>
    </div>
  );
}
