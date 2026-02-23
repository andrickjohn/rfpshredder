// src/components/dashboard/settings/security-form.tsx
// Purpose: Change password form
// Dependencies: @/lib/supabase/client

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function SecurityForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('saving');
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setStatus('success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setError('Unable to update password. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Security</h3>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
            placeholder="Min. 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
            placeholder="Re-enter new password"
          />
        </div>
        {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        {status === 'success' && <div role="status" className="text-sm text-green-600">Password updated successfully.</div>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="px-4 py-2 bg-[#1B365D] text-white text-sm font-medium rounded-md hover:bg-[#122442] transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
