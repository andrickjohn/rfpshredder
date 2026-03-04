// src/app/dashboard/page.tsx
// Purpose: Premium dashboard — stats, flow diagram, upload, history
// Dependencies: supabase/server, all dashboard components, billing/subscription
// Test spec: qa/test-specs/full-integration.md

import { createClient } from '@/lib/supabase/server';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { TrustBanner } from '@/components/dashboard/trust-banner';
import { ProcessingFlow } from '@/components/dashboard/processing-flow';
import { UploadForm } from '@/components/dashboard/upload-form';
import { ShredHistory } from '@/components/dashboard/shred-history';
import { DashboardClientWrapper } from '@/components/dashboard/dashboard-client-wrapper';
import { canShred } from '@/lib/billing/subscription';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, trial_shreds_used, full_name, email')
    .eq('id', user!.id)
    .single();

  // Aggregate stats from shred history
  const { data: shredLogs } = await supabase
    .from('shred_log')
    .select('requirement_count, processing_time_ms, status');

  const successLogs = shredLogs?.filter((s) => s.status === 'success') ?? [];
  const totalShreds = successLogs.length;
  const totalRequirements = successLogs.reduce((sum, s) => sum + (s.requirement_count ?? 0), 0);
  // Estimate: each shred saves ~14 hours of manual compliance matrix work
  const timeSavedHours = totalShreds > 0 ? Math.round(totalShreds * 14) : 0;

  const userCanShred = profile ? canShred(profile) : false;
  const isTrialExhausted = profile?.subscription_status === 'trial'
    && (profile?.trial_shreds_used ?? 0) >= 1;
  const isSuperAdmin = user?.email === 'admin@automatemomentum.com';

  return (
    <DashboardClientWrapper>
      <div className="space-y-6">
        <WelcomeHeader
          fullName={profile?.full_name ?? null}
          status={profile?.subscription_status ?? 'trial'}
          tier={profile?.subscription_tier ?? 'free'}
          trialShredsUsed={profile?.trial_shreds_used ?? 0}
        />

        <StatsCards
          totalShreds={totalShreds}
          totalRequirements={totalRequirements}
          timeSavedHours={timeSavedHours}
        />

        <TrustBanner />

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Shred an RFP</h3>
          <UploadForm canShred={userCanShred} isTrialExhausted={isTrialExhausted} isSuperAdmin={isSuperAdmin} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
          <ShredHistory />
        </div>

        {/* Processing pipeline at bottom - shows live progress during upload */}
        <ProcessingFlow />
      </div>
    </DashboardClientWrapper>
  );
}
