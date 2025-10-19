import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import {
  countSupportReactions,
  createReactionTally,
  isPortalReactionType,
  type PortalReactionType,
} from '@/lib/reactions';
import { invalidatePlanCaches } from '@/lib/cache/invalidate';

export async function POST(
  req: NextRequest,
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

  const profile = await ensurePortalProfile(supabase, user.id);

  const resolvedParams = await params;
  const updateParam = resolvedParams.updateId;
  const updateId = Array.isArray(updateParam) ? updateParam[0] : updateParam;

  if (!updateId) {
    return NextResponse.json({ error: 'Plan update id is required.' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
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

  const portal = supabase.schema('portal');

  const { data: updateMeta, error: updateMetaError } = await portal
    .from('plan_updates')
    .select('plan_id, plan:plan_id(slug)')
    .eq('id', updateId)
    .maybeSingle();

  if (updateMetaError) {
    console.error('Failed to load plan metadata for reaction', updateMetaError);
    return NextResponse.json({ error: 'Unable to process reaction' }, { status: 500 });
  }

  if (!updateMeta) {
    return NextResponse.json({ error: 'Plan update not found.' }, { status: 404 });
  }

  const planSlug = (updateMeta.plan as { slug?: string } | null)?.slug ?? null;
  const revalidatePaths = planSlug ? ['/portal/plans', `/portal/plans/${planSlug}`] : ['/portal/plans'];

  const { data: existingVote, error: existingVoteError } = await portal
    .from('plan_update_votes')
    .select('reaction')
    .eq('plan_update_id', updateId)
    .eq('voter_profile_id', profile.id)
    .maybeSingle<{ reaction: PortalReactionType }>();

  if (existingVoteError) {
    console.error('Failed to load existing plan update reaction', existingVoteError);
    return NextResponse.json({ error: 'Unable to process reaction' }, { status: 500 });
  }

  let viewerReaction: PortalReactionType | null = existingVote?.reaction ?? null;

  if (viewerReaction && (reactionToApply === null || reactionToApply === viewerReaction)) {
    const { error: deleteError } = await portal
      .from('plan_update_votes')
      .delete()
      .eq('plan_update_id', updateId)
      .eq('voter_profile_id', profile.id);

    if (deleteError) {
      console.error('Failed to remove plan update reaction', deleteError);
      return NextResponse.json({ error: 'Unable to update reaction' }, { status: 500 });
    }

    viewerReaction = null;
  } else if (viewerReaction && reactionToApply) {
    const { error: updateError } = await portal
      .from('plan_update_votes')
      .update({ reaction: reactionToApply })
      .eq('plan_update_id', updateId)
      .eq('voter_profile_id', profile.id);

    if (updateError) {
      console.error('Failed to change plan update reaction', updateError);
      return NextResponse.json({ error: 'Unable to update reaction' }, { status: 500 });
    }

    viewerReaction = reactionToApply;
  } else if (!viewerReaction && reactionToApply) {
    const { error: insertError } = await portal
      .from('plan_update_votes')
      .insert({ plan_update_id: updateId, voter_profile_id: profile.id, reaction: reactionToApply });

    if (insertError) {
      console.error('Failed to create plan update reaction', insertError);
      return NextResponse.json({ error: 'Unable to update reaction' }, { status: 500 });
    }

    viewerReaction = reactionToApply;
  }

  const { data: reactionRows, error: reactionError } = await portal
    .from('plan_update_reaction_totals')
    .select('reaction, reaction_count')
    .eq('plan_update_id', updateId)
    .returns<{ reaction: PortalReactionType; reaction_count: number }[]>();

  const reactionTotals = createReactionTally();

  if (reactionError) {
    console.error('Failed to load plan update reaction totals', reactionError);
  } else {
    for (const row of reactionRows ?? []) {
      const count = Number(row.reaction_count ?? 0);
      reactionTotals[row.reaction] = Number.isFinite(count) ? count : 0;
    }
  }

  const supportCount = countSupportReactions(reactionTotals);

  await invalidatePlanCaches({ planSlug: planSlug ?? undefined, paths: revalidatePaths });

  return NextResponse.json({
    activeReaction: viewerReaction,
    reactionTotals,
    supportCount,
    voted: Boolean(viewerReaction),
  });
}
