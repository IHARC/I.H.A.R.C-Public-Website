import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';

const MODERATOR_ROLES = new Set(['moderator', 'admin']);
const ALLOWED_STATUSES = new Set(['open', 'accepted', 'not_moving_forward', 'added_to_plan']);

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

  const profile = await ensurePortalProfile(user.id);
  if (!MODERATOR_ROLES.has(profile.role ?? '')) {
    return NextResponse.json({ error: 'Only moderators can change plan update status.' }, { status: 403 });
  }

  const resolvedParams = await params;
  const updateParam = resolvedParams.updateId;
  const updateId = Array.isArray(updateParam) ? updateParam[0] : updateParam;

  if (!updateId) {
    return NextResponse.json({ error: 'Plan update id is required.' }, { status: 400 });
  }

  let payload: {
    status?: unknown;
    decision_summary?: unknown;
    summary_update?: unknown;
  };

  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid status payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const status = typeof payload.status === 'string' ? payload.status : '';
  const decisionSummary = typeof payload.decision_summary === 'string' ? payload.decision_summary.trim() : '';
  const summaryUpdate = typeof payload.summary_update === 'string' ? payload.summary_update.trim() : '';

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Unsupported status transition.' }, { status: 422 });
  }

  const service = createSupabaseServiceClient();
  const portal = service.schema('portal');

  const { data: update, error: updateError } = await portal
    .from('plan_updates')
    .select(
      `id, status, plan_id, plan:plan_id(title, canonical_summary), problem, evidence, proposed_change, impact, risks, measurement`
    )
    .eq('id', updateId)
    .maybeSingle();

  if (updateError) {
    console.error('Failed to load plan update', updateError);
    return NextResponse.json({ error: 'Unable to update status.' }, { status: 500 });
  }

  if (!update) {
    return NextResponse.json({ error: 'Plan update not found.' }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (status === 'open') {
    const { error: reopenError } = await portal
      .from('plan_updates')
      .update({ status: 'open', opened_at: now })
      .eq('id', updateId);

    if (reopenError) {
      console.error('Failed to reopen plan update', reopenError);
      return NextResponse.json({ error: 'Unable to reopen plan update.' }, { status: 500 });
    }

    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId: user.id,
      action: 'update_opened',
      entityType: 'plan',
      entityId: update.plan_id,
      meta: { plan_update_id: updateId },
    });

    return NextResponse.json({ status: 'open' });
  }

  if (status === 'accepted' || status === 'not_moving_forward') {
    if (!decisionSummary) {
      return NextResponse.json({ error: 'Add a decision note before closing this update.' }, { status: 422 });
    }

    const { error: statusError } = await portal
      .from('plan_updates')
      .update({ status, decided_at: now })
      .eq('id', updateId);

    if (statusError) {
      console.error('Failed to update plan update status', statusError);
      return NextResponse.json({ error: 'Unable to update plan status.' }, { status: 500 });
    }

    const { error: noteError } = await portal.from('plan_decision_notes').insert({
      plan_id: update.plan_id,
      plan_update_id: updateId,
      author_profile_id: profile.id,
      decision: status,
      summary: decisionSummary,
    });

    if (noteError) {
      console.error('Failed to insert decision note', noteError);
      return NextResponse.json({ error: 'Unable to record decision note.' }, { status: 500 });
    }

    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId: user.id,
      action: status === 'accepted' ? 'update_accepted' : 'update_declined',
      entityType: 'plan',
      entityId: update.plan_id,
      meta: { plan_update_id: updateId },
    });

    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId: user.id,
      action: 'decision_posted',
      entityType: 'plan',
      entityId: update.plan_id,
      meta: { plan_update_id: updateId },
    });

    return NextResponse.json({ status });
  }

  if (status === 'added_to_plan') {
    if (!summaryUpdate) {
      return NextResponse.json({ error: 'Provide an overview summary update before marking as added.' }, { status: 422 });
    }

    const { error: statusError } = await portal
      .from('plan_updates')
      .update({ status, decided_at: now })
      .eq('id', updateId);

    if (statusError) {
      console.error('Failed to mark update as added to plan', statusError);
      return NextResponse.json({ error: 'Unable to finalize update.' }, { status: 500 });
    }

    const { error: planUpdateError } = await portal
      .from('plans')
      .update({ canonical_summary: summaryUpdate })
      .eq('id', update.plan_id);

    if (planUpdateError) {
      console.error('Failed to refresh plan summary', planUpdateError);
      return NextResponse.json({ error: 'Unable to refresh plan overview.' }, { status: 500 });
    }

    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId: user.id,
      action: 'update_accepted',
      entityType: 'plan',
      entityId: update.plan_id,
      meta: { plan_update_id: updateId, added_to_plan: true },
    });

    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId: user.id,
      action: 'decision_posted',
      entityType: 'plan',
      entityId: update.plan_id,
      meta: { plan_update_id: updateId, overview_updated: true },
    });

    return NextResponse.json({ status });
  }

  return NextResponse.json({ status: update.status });
}
