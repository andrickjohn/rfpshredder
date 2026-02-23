// src/app/api/account/delete/route.ts
// Purpose: Delete user account permanently
// Dependencies: supabase/server, supabase/admin
// SECURITY: Auth required. Uses admin client for user deletion.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Please sign in.' } },
        { status: 401 }
      );
    }

    // Use admin client to delete user (cascades to profiles, shred_log)
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: 'Unable to delete account. Please try again.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
