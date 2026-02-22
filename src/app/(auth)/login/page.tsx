// src/app/(auth)/login/page.tsx
// Purpose: Login page — email/password + magic link
// Dependencies: AuthForm component
// Test spec: qa/test-specs/auth.md

'use client';

import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [useMagicLink, setUseMagicLink] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

      <AuthForm mode={useMagicLink ? 'magic-link' : 'login'} />

      <button
        type="button"
        onClick={() => setUseMagicLink(!useMagicLink)}
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
      >
        {useMagicLink ? 'Use password instead' : 'Use magic link instead'}
      </button>

      <div className="mt-6 text-sm text-gray-500 space-y-2 text-center">
        <p>
          <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">
            Forgot your password?
          </Link>
        </p>
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
