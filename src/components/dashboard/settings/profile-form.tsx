// src/components/dashboard/settings/profile-form.tsx
// Purpose: Edit user profile (full name). Email is read-only.
// Dependencies: @/lib/supabase/client

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  fullName: string;
  email: string;
}

export function ProfileForm({ fullName, email }: ProfileFormProps) {
  const [name, setName] = useState(fullName);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });
      if (authError) throw authError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setError('Unable to update profile. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Profile</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
          />
        </div>
        <div>
          <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="settings-email"
            type="email"
            value={email}
            disabled
            className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Contact support to change your email address.</p>
        </div>
        {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        {status === 'success' && <div role="status" className="text-sm text-green-600">Profile updated.</div>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="px-4 py-2 bg-[#1B365D] text-white text-sm font-medium rounded-md hover:bg-[#122442] transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
