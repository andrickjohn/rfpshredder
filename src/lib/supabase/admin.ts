// src/lib/supabase/admin.ts
// Purpose: Service role Supabase client — webhooks and background jobs ONLY
// Dependencies: @supabase/supabase-js
// Test spec: qa/test-specs/auth.md
// SECURITY: Never use in route handlers that face user requests directly

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
