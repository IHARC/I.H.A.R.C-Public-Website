import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';
import {
  countSupportReactions,
  createReactionTally,
  isPortalReactionType,
  type PortalReactionType,
} from '@/lib/reactions';

type IdeaReactionAuditAction =
  | 'idea_reaction_added'
  | 'idea_reaction_changed'
  | 'idea_reaction_removed';

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

  const profile = await ensurePortalProfile(supabase, user.id);

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select('id, status')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Failed to load idea for reactions', ideaError);
    return NextResponse.json({ error: 'Unable to process reaction' }, { status: 500 });
  }

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  if (idea.status === 'archived') {
    return NextResponse.json({ error: 'Reactions are disabled for archived ideas' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    payload = undefined;
  }

  const requestedReaction =
    payload && typeof payload === 'object' && payload !== null && 'reaction' in payload
      ? (payload as { reaction?: unknown }).reaction
      : undefined;

  let reactionToApply: PortalReactionType | null;

  if (requestedReaction === null) {
    reactionToApply = null;
  } else if (typeof requestedReaction === 'string') {
    if (!isPortalReactionType(requestedReaction)) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }
    reactionToApply = requestedReaction;
  } else if (typeof requestedReaction === 'undefined') {
    reactionToApply = 'like';
  } else {
    return NextResponse.json({ error: 'Invalid reaction payload' }, { status: 400 });
  }

  const { data: existingVote, error: existingVoteError } = await portal
    .from('votes')
    .select('reaction')
    .eq('idea_id', ideaId)
    .eq('voter_profile_id', profile.id)
    .maybeSingle<{ reaction: PortalReactionType }>();

  if (existingVoteError) {
    console.error('Failed to load existing reaction', existingVoteError);
    return NextResponse.json({ error: 'Unable to process reaction' }, { status: 500 });
  }

  let viewerReaction: PortalReactionType | null = existingVote?.reaction ?? null;
  let auditAction: IdeaReactionAuditAction | null = null;

  if (viewerReaction && (reactionToApply === null || reactionToApply === viewerReaction)) {
    const { error: deleteError } = await portal
      .from('votes')
      .delete()
      .eq('idea_id', ideaId)
      .eq('voter_profile_id', profile.id);

    if (deleteError) {
      console.error('Failed to remove reaction', deleteError);
      return NextResponse.json({ error: 'Unable to update reaction' }, { status: 500 });
    }

    viewerReaction = null;
    auditAction = 'idea_reaction_removed';
  } else if (viewerReaction && reactionToApply) {
    const { error: updateError } = await portal
      .from('votes')
      .update({ reaction: reactionToApply })
      .eq('idea_id', ideaId)
      .eq('voter_profile_id', profile.id);

    if (updateError) {
      console.error('Failed to change reaction', updateError);
      return NextResponse.json({ error: 'Unable to update reaction' }, { status: 500 });
    }

    viewerReaction = reactionToApply;
    auditAction = 'idea_reaction_changed';
  } else if (!viewerReaction && reactionToApply) {
    const { error: insertError } = await portal
      .from('votes')
      .insert({ idea_id: ideaId, voter_profile_id: profile.id, reaction: reactionToApply });

    if (insertError) {
      console.error('Failed to record reaction', insertError);
      return NextResponse.json({ error: 'Unable to update reaction' }, { status: 500 });
    }

    viewerReaction = reactionToApply;
    auditAction = 'idea_reaction_added';
  }

  const { data: reactionRows, error: reactionError } = await portal
    .from('idea_reaction_totals')
    .select('reaction, reaction_count')
    .eq('idea_id', ideaId)
    .returns<{ reaction: PortalReactionType; reaction_count: number }[]>();

  const reactionTotals = createReactionTally();

  if (reactionError) {
    console.error('Failed to load reaction totals', reactionError);
  } else {
    for (const row of reactionRows ?? []) {
      const count = Number(row.reaction_count ?? 0);
      reactionTotals[row.reaction] = Number.isFinite(count) ? count : 0;
    }
  }

  const supportCount = countSupportReactions(reactionTotals);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

  if (auditAction) {
    await logAuditEvent(supabase, {
      actorProfileId: profile.id,
      action: auditAction,
      entityType: 'idea',
      entityId: ideaId,
      meta: {
        reaction: viewerReaction,
        reaction_totals: reactionTotals,
        support_count: supportCount,
        ip_hash: ipHash,
        user_agent: userAgent ?? null,
      },
    });
  }

  return NextResponse.json({
    activeReaction: viewerReaction,
    reactionTotals,
    supportCount,
    voteCount: supportCount,
  });
}
