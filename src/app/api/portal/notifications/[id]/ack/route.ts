import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const resolvedParams = await params;
  const notificationParam = resolvedParams.id;
  const notificationId = Array.isArray(notificationParam) ? notificationParam[0] : notificationParam;
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  const portal = supabase.schema('portal');

  const { data, error: updateError } = await portal
    .from('notifications')
    .update({ acknowledged_at: new Date().toISOString(), status: 'acknowledged' })
    .eq('id', notificationId)
    .eq('profile_id', profile.id)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('Failed to acknowledge notification', updateError);
    return NextResponse.json({ error: 'Unable to acknowledge notification' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  return NextResponse.json({ status: 'acknowledged' });
}
