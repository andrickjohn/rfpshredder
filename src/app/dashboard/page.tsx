// src/app/dashboard/page.tsx
// Purpose: Protected dashboard — upload RFPs, view history, manage subscription
// Dependencies: supabase/server, dashboard components, billing/subscription
// Test spec: qa/test-specs/full-integration.md

import { createClient } from '@/lib/supabase/server';
import { UploadForm } from '@/components/dashboard/upload-form';
import { ShredHistory } from '@/components/dashboard/shred-history';
import { SubscriptionStatus } from '@/components/dashboard/subscription-status';
import { canShred } from '@/lib/billing/subscription';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, trial_shreds_used')
    .eq('id', user!.id)
    .single();

  const userCanShred = profile ? canShred(profile) : false;
  const isTrialExhausted = profile?.subscription_status === 'trial'
    && (profile?.trial_shreds_used ?? 0) >= 1;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {profile && (
        <SubscriptionStatus
          status={profile.subscription_status}
          tier={profile.subscription_tier}
          trialShredsUsed={profile.trial_shreds_used}
        />
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Shred an RFP</h3>
        <UploadForm
          canShred={userCanShred}
          isTrialExhausted={isTrialExhausted}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Shreds</h3>
        <ShredHistory />
      </div>
    </div>
  );
}
