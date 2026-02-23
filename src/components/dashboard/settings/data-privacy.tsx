// src/components/dashboard/settings/data-privacy.tsx
// Purpose: Zero-retention policy explainer + delete account option
// Dependencies: @/lib/supabase/client

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DataPrivacyProps {
  memberSince: string;
}

export function DataPrivacy({ memberSince }: DataPrivacyProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Failed to delete account');
      }
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account.');
      setDeleting(false);
    }
  }

  const features = [
    {
      title: 'Zero Document Retention',
      description: 'Uploaded RFPs are processed entirely in memory and immediately purged. We never store document content on our servers, in databases, or in logs.',
      icon: (
        <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      title: 'What We Store',
      description: 'Only your account info (email, name) and processing metadata (page count, requirement count, processing time). Never document content.',
      icon: (
        <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
        </svg>
      ),
    },
    {
      title: 'Infrastructure',
      description: 'Built on Vercel and Supabase with SOC 2 compliant infrastructure. All data encrypted in transit with TLS.',
      icon: (
        <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Data & Privacy</h3>

      <div className="space-y-4">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-900">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      {memberSince && (
        <p className="text-xs text-gray-400 mt-4">
          Member since {new Date(memberSince).toLocaleDateString()}
        </p>
      )}

      {/* Danger zone */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h4>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE"
            />
            {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
