// src/lib/supabase/client.ts
// Purpose: Browser-side Supabase client for client components
// Dependencies: @supabase/supabase-js
// Test spec: qa/test-specs/auth.md

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost.supabase.mock',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
  );

  // DEV BYPASS: Check if user used the headless override locally
  if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined' && document.cookie.includes('sb-dev-bypass-token=admin-override')) {
    client.auth.getUser = async () => ({
      data: {
        user: { id: 'dev-bypass-local-uuid', user_metadata: { full_name: 'Local Dev Admin' }, email: 'admin@rfpshredder.local' }
      },
      error: null
    } as any);

    client.auth.getSession = async () => ({
      data: {
        session: { access_token: 'mock-token', user: { id: 'dev-bypass-local-uuid' } }
      },
      error: null
    } as any);

    client.auth.signOut = async () => {
      document.cookie = "sb-dev-bypass-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = '/login';
      return { error: null };
    };
  }

  return client;
}
