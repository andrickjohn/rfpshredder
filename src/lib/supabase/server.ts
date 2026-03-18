// src/lib/supabase/server.ts
// Purpose: Server-side Supabase client for RSC and route handlers
// Dependencies: @supabase/ssr, next/headers
// Test spec: qa/test-specs/auth.md

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — safe to ignore.
            // Middleware will refresh the session cookie.
          }
        },
      },
    }
  );

  // DEV BYPASS: Override auth.getUser so layout and server components treat us as logged in
  if (process.env.NODE_ENV === 'development' && cookieStore.get('sb-dev-bypass-token')?.value === 'admin-override') {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async () => {
      // Mocked local user
      return {
        data: {
          user: {
            id: 'dev-bypass-local-uuid',
            app_metadata: {},
            user_metadata: { full_name: 'Local Dev Admin' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: 'admin@rfpshredder.local',
          }
        },
        error: null
      } as any;
    };
  }

  return client;
}
