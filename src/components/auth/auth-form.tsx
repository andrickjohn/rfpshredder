// src/components/auth/auth-form.tsx
// Purpose: Reusable auth form component for login, signup, forgot-password
// Dependencies: react, @/lib/supabase/client, @/lib/validations/auth
// Test spec: qa/test-specs/auth.md

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  mode: 'login' | 'signup';
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
          let errorMsg = signUpError.message;
          if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('already registered')) {
             errorMsg = 'This email appears to be registered. Please try signing in instead.';
          }
          setError(errorMsg);
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
            : 'Sign In'}
      </button>

      {/* DEV BYPASS BUTTON */}
      {process.env.NODE_ENV === 'development' && mode === 'login' && (
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            console.warn("Emulating headless admin auth bypass natively.");
            document.cookie = "sb-dev-bypass-token=admin-override; path=/; max-age=3600";
            router.push('/dashboard');
            router.refresh();
          }}
          disabled={loading}
          className="w-full mt-4 py-2 px-4 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 transition-colors shadow shadow-emerald-600/20"
        >
          🚀 1-Click Dev Bypass (Admin)
        </button>
      )}
    </form>
  );
}
