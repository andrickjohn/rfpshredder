// src/app/(auth)/signup/page.tsx
// Purpose: Signup page — email/password with full name
// Dependencies: AuthForm component
// Test spec: qa/test-specs/auth.md

import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Account</h2>

      <AuthForm mode="signup" />

      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
