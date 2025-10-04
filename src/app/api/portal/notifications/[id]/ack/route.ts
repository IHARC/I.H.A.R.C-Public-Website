import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile } from '@/lib/profile';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const notificationId = params.id;
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(user.id);
  const service = createSupabaseServiceClient();
  const portal = service.schema('portal');

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
