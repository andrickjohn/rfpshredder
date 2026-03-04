// src/app/dashboard/settings/page.tsx
// Purpose: Account settings — profile, security, subscription, data privacy
// Dependencies: supabase/server, settings components

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/dashboard/settings/profile-form';
import { SecurityForm } from '@/components/dashboard/settings/security-form';
import { SubscriptionCard } from '@/components/dashboard/settings/subscription-card';
import { DataPrivacy } from '@/components/dashboard/settings/data-privacy';
import { AdminLLMSettings } from '@/components/dashboard/settings/admin-llm-settings';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_status, subscription_tier, stripe_customer_id, created_at, email, preferred_llm_model')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.email === 'admin@automatemomentum.com';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      {isSuperAdmin && (
        <AdminLLMSettings currentModel={profile?.preferred_llm_model || 'claude-3-5-haiku-20241022'} />
      )}

      <ProfileForm
        fullName={profile?.full_name ?? ''}
        email={user.email ?? ''}
      />

      <SecurityForm />

      <SubscriptionCard
        status={profile?.subscription_status ?? 'trial'}
        tier={profile?.subscription_tier ?? 'free'}
        hasStripeCustomer={!!profile?.stripe_customer_id}
      />

      <DataPrivacy memberSince={profile?.created_at ?? ''} />
    </div>
  );
}
