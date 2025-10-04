import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile } from '@/lib/profile';

export async function POST() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(user.id);
  const displayName = profile.display_name?.trim();

  if (!displayName || displayName.length < 2) {
    return NextResponse.json(
      { error: 'Update your display name before confirming.' },
      { status: 412 },
    );
  }

  const service = createSupabaseServiceClient();

  const { error: updateError } = await service
    .from('portal.profiles')
    .update({ display_name_confirmed_at: new Date().toISOString() })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Failed to confirm display name', updateError);
    return NextResponse.json({ error: 'Unable to confirm display name' }, { status: 500 });
  }

  return NextResponse.json({ status: 'confirmed' });
}
