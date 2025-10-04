import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(user.id);

  const resolvedParams = await params;
  const updateParam = resolvedParams.updateId;
  const updateId = Array.isArray(updateParam) ? updateParam[0] : updateParam;

  if (!updateId) {
    return NextResponse.json({ error: 'Plan update id is required.' }, { status: 400 });
  }

  const portal = supabase.schema('portal');

  const { data: existingVote } = await portal
    .from('plan_update_votes')
    .select('plan_update_id')
    .eq('plan_update_id', updateId)
    .eq('voter_profile_id', profile.id)
    .maybeSingle();

  if (existingVote) {
    const { error: deleteError } = await portal
      .from('plan_update_votes')
      .delete()
      .eq('plan_update_id', updateId)
      .eq('voter_profile_id', profile.id);
    if (deleteError) {
      console.error('Failed to remove plan update vote', deleteError);
      return NextResponse.json({ error: 'Unable to update support' }, { status: 500 });
    }
  } else {
    const { error: insertError } = await portal
      .from('plan_update_votes')
      .insert({ plan_update_id: updateId, voter_profile_id: profile.id });
    if (insertError) {
      console.error('Failed to create plan update vote', insertError);
      return NextResponse.json({ error: 'Unable to update support' }, { status: 500 });
    }
  }

  const { count } = await portal
    .from('plan_update_votes')
    .select('plan_update_id', { head: true, count: 'exact' })
    .eq('plan_update_id', updateId);

  const supportCount = count ?? 0;
  const voted = !existingVote;

  return NextResponse.json({ voted, supportCount });
}
