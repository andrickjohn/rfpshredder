// src/components/dashboard/shred-history.tsx
// Purpose: Display recent shred history from shred_log (metadata only)
// Dependencies: @/lib/supabase/server
// Test spec: qa/test-specs/full-integration.md
// SECURITY: Only displays metadata — NEVER document content

import { createClient } from '@/lib/supabase/server';

export async function ShredHistory() {
  const supabase = await createClient();
  const { data: shreds } = await supabase
    .from('shred_log')
    .select('id, page_count, requirement_count, processing_time_ms, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!shreds || shreds.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-400 text-sm">No shreds yet. Upload your first RFP above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pages</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Requirements</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {shreds.map((shred, i) => (
              <tr key={shred.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3 px-4 text-sm text-gray-900">
                  {new Date(shred.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{shred.page_count}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{shred.requirement_count}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {(shred.processing_time_ms / 1000).toFixed(1)}s
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    shred.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {shred.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
