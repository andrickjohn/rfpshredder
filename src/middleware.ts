// src/middleware.ts
// Purpose: Next.js middleware — auth token refresh, route protection, security headers
// Dependencies: @/lib/supabase/middleware, @/lib/security/headers
// Test spec: qa/test-specs/auth.md, qa/test-specs/full-integration.md

import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security/headers';

export async function middleware(request: NextRequest) {
  // Refresh Supabase auth tokens + handle route protection
  const response = await updateSession(request);

  // Apply security headers to all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
