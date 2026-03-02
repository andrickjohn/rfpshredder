// src/lib/supabase/middleware.ts
// Purpose: Supabase client for Next.js middleware (token refresh)
// Dependencies: @supabase/ssr, next/server
// Test spec: qa/test-specs/auth.md

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Redirect unauthenticated users away from protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect authenticated users away from auth pages
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password');

  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // FAST PATH: Skip Supabase auth check for completely public routes (like the landing page).
  // This prevents Vercel Edge Function timeouts (504 MIDDLEWARE_INVOCATION_TIMEOUT).
  if (!isProtectedRoute && !isAuthRoute && !isApiRoute) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
