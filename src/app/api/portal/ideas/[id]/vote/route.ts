import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const resolvedParams = await params;
  const ideaParam = resolvedParams.id;
  const ideaId = Array.isArray(ideaParam) ? ideaParam[0] : ideaParam;
  if (!ideaId) {
    return NextResponse.json({ error: 'Idea id is required' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(user.id);

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select('id, vote_count, status')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Failed to load idea for voting', ideaError);
    return NextResponse.json({ error: 'Unable to process vote' }, { status: 500 });
  }

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  if (idea.status === 'archived') {
    return NextResponse.json({ error: 'Voting is disabled for archived ideas' }, { status: 400 });
  }

  const { data: existingVote } = await portal
    .from('votes')
    .select('idea_id')
    .eq('idea_id', ideaId)
    .eq('voter_profile_id', profile.id)
    .maybeSingle();

  let voted = false;
  let voteAction: 'idea_voted' | 'idea_unvoted';

  if (existingVote) {
    const { error: deleteError } = await portal
      .from('votes')
      .delete()
      .eq('idea_id', ideaId)
      .eq('voter_profile_id', profile.id);
    if (deleteError) {
      console.error('Failed to remove vote', deleteError);
      return NextResponse.json({ error: 'Unable to update vote' }, { status: 500 });
    }
    voteAction = 'idea_unvoted';
  } else {
    const { error: insertError } = await portal
      .from('votes')
      .insert({ idea_id: ideaId, voter_profile_id: profile.id });
    if (insertError) {
      console.error('Failed to insert vote', insertError);
      return NextResponse.json({ error: 'Unable to update vote' }, { status: 500 });
    }
    voted = true;
    voteAction = 'idea_voted';
  }

  const { data: updatedIdea } = await portal
    .from('ideas')
    .select('vote_count')
    .eq('id', ideaId)
    .maybeSingle();

  const voteCount = updatedIdea?.vote_count ?? idea.vote_count ?? 0;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId: user.id,
    action: voteAction,
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      vote_count: voteCount,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
    },
  });

  return NextResponse.json({ voted, voteCount });
}
