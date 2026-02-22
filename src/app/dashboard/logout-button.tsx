// src/app/dashboard/logout-button.tsx
// Purpose: Client-side logout button for dashboard header
// Dependencies: @/lib/supabase/client, next/navigation

'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
    >
      Sign Out
    </button>
  );
}
