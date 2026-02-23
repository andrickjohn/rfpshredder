// src/app/api/cron/trial-nudge/route.ts
// Purpose: Cron job to send trial_nudge emails 24h after signup
// Dependencies: supabase/admin, email/send
// Trigger: Vercel Cron — daily at 09:00 UTC
// SECURITY: Vercel cron authorization header required

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Verify Vercel Cron authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron authorization.' } },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // Find trial users who signed up 23-25 hours ago and haven't shredded yet
  const now = new Date();
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000);

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at, trial_shreds_used')
    .eq('subscription_status', 'trial')
    .eq('trial_shreds_used', 0)
    .gte('created_at', windowStart.toISOString())
    .lte('created_at', windowEnd.toISOString());

  if (error) {
    console.error('[CRON] trial-nudge query error:', error.message);
    return NextResponse.json({ sent: 0, error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const profile of profiles ?? []) {
    if (!profile.email) continue;

    const result = await sendEmail({
      to: profile.email,
      type: 'trial_nudge',
      data: { first_name: profile.full_name || 'there' },
    });

    if (result.success) sent++;
  }

  return NextResponse.json({
    sent,
    checked: profiles?.length ?? 0,
    timestamp: now.toISOString(),
  });
}
