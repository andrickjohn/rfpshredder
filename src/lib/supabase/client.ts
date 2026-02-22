// src/lib/supabase/client.ts
// Purpose: Browser-side Supabase client for client components
// Dependencies: @supabase/supabase-js
// Test spec: qa/test-specs/auth.md

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
