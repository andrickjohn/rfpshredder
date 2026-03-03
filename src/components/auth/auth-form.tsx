// src/components/auth/auth-form.tsx
// Purpose: Reusable auth form component for login, signup, forgot-password
// Dependencies: react, @/lib/supabase/client, @/lib/validations/auth
// Test spec: qa/test-specs/auth.md

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  mode: 'login' | 'signup' | 'forgot-password' | 'magic-link';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setMessage('Account created! Check your email to confirm your address, then sign in.');
      } else if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) {
          setError('Invalid email or password');
          return;
        }
        router.push('/dashboard');
        router.refresh();
      } else if (mode === 'magic-link') {
        const { error: magicError } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
        });
        if (magicError) {
          setError('Unable to send magic link. Please try again.');
          return;
        }
        setMessage('Check your email for a magic link to sign in.');
      } else if (mode === 'forgot-password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/auth/callback` }
        );
        if (resetError) {
          setError('Unable to send reset email. Please try again.');
          return;
        }
        setMessage('Check your email for a password reset link.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const showPassword = mode === 'login' || mode === 'signup';
  const showName = mode === 'signup';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {showName && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jane Smith"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="you@company.com"
        />
      </div>

      {showPassword && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Min. 8 characters"
          />
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-[#1B365D] text-white font-medium rounded-md hover:bg-[#152a4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? 'Please wait...'
          : mode === 'signup'
            ? 'Create Account'
            : mode === 'login'
              ? 'Sign In'
              : mode === 'magic-link'
                ? 'Send Magic Link'
                : 'Send Reset Link'}
      </button>

      {process.env.NODE_ENV === 'development' && mode === 'login' && (
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            setEmail('admin@automatemomentum.com');
            setPassword('password123');
            // we need to set the state and then call the api immediately
            // because setState is async
            setLoading(true);
            setError(null);
            setMessage(null);
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: 'admin@automatemomentum.com',
              password: 'password123',
            });
            if (signInError) {
              setError('Failed to auto-login. Did you run the set-dev-password script?');
              setLoading(false);
              return;
            }
            router.push('/dashboard');
            router.refresh();
          }}
          className="w-full mt-2 py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          🚀 Local Dev: Auto-Login as Admin
        </button>
      )}
    </form>
  );
}
