// src/app/(auth)/forgot-password/page.tsx
// Purpose: Password reset request page
// Dependencies: AuthForm component
// Test spec: qa/test-specs/auth.md

import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Reset Password</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <AuthForm mode="forgot-password" />

      <p className="mt-6 text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:text-blue-800">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
