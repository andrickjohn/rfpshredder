// src/app/(auth)/auth/callback/route.ts
// Purpose: Handles OAuth callbacks and reset flows from Supabase
// Dependencies: @supabase/ssr, next/server
// Test spec: qa/test-specs/auth.md

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmailAsync } from '@/lib/email/send';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
              // Ignore — middleware handles session refresh
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email (fire-and-forget, never blocks redirect)
      if (data.user?.email) {
        const firstName = data.user.user_metadata?.full_name?.split(' ')[0] || 'there';
        sendEmailAsync({
          to: data.user.email,
          type: 'welcome',
          data: { first_name: firstName },
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
