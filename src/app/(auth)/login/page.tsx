// src/app/(auth)/login/page.tsx
// Purpose: Login page — email/password
// Dependencies: AuthForm component
// Test spec: qa/test-specs/auth.md

'use client';

import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

      <AuthForm mode="login" />

      <div className="mt-8 text-sm text-gray-500 space-y-3 text-center">
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
