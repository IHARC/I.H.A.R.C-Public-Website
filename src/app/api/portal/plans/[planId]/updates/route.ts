import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';

const REQUIRED_FIELDS: Array<{ key: keyof PlanUpdatePayload; label: string }> = [
  { key: 'problem', label: 'Problem' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'proposed_change', label: 'Proposed change' },
  { key: 'impact', label: 'Impact' },
  { key: 'risks', label: 'Risks' },
  { key: 'measurement', label: 'How we’ll measure success' },
];

type PlanUpdatePayload = {
  problem: string;
  evidence: string;
  proposed_change: string;
  impact: string;
  risks: string;
  measurement: string;
};

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
  if (!profile) {
    return NextResponse.json({ error: 'Profile is required to submit updates.' }, { status: 403 });
  }

  const resolvedParams = await params;
  const planParam = resolvedParams.planId;
  const planId = Array.isArray(planParam) ? planParam[0] : planParam;

  if (!planId) {
    return NextResponse.json({ error: 'Plan id is required' }, { status: 400 });
  }

  let payload: Partial<Record<keyof PlanUpdatePayload, unknown>>;
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid plan update payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const normalized: PlanUpdatePayload = {
    problem: typeof payload.problem === 'string' ? payload.problem.trim() : '',
    evidence: typeof payload.evidence === 'string' ? payload.evidence.trim() : '',
    proposed_change: typeof payload.proposed_change === 'string' ? payload.proposed_change.trim() : '',
    impact: typeof payload.impact === 'string' ? payload.impact.trim() : '',
    risks: typeof payload.risks === 'string' ? payload.risks.trim() : '',
    measurement: typeof payload.measurement === 'string' ? payload.measurement.trim() : '',
  };

  const missingField = REQUIRED_FIELDS.find((field) => !normalized[field.key]);
  if (missingField) {
    return NextResponse.json({ error: `${missingField.label} is required.` }, { status: 422 });
  }

  const portal = supabase.schema('portal');

  const { data: plan, error: planError } = await portal
    .from('plans')
    .select('id')
    .eq('id', planId)
    .maybeSingle();

  if (planError) {
    console.error('Failed to load plan before update', planError);
    return NextResponse.json({ error: 'Unable to submit update.' }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
  }

  const now = new Date().toISOString();

  const { data: update, error: insertError } = await portal
    .from('plan_updates')
    .insert({
      plan_id: planId,
      author_profile_id: profile.id,
      problem: normalized.problem,
      evidence: normalized.evidence,
      proposed_change: normalized.proposed_change,
      impact: normalized.impact,
      risks: normalized.risks,
      measurement: normalized.measurement,
      status: 'open',
      opened_at: now,
    })
    .select('id, created_at')
    .single();

  if (insertError || !update) {
    console.error('Failed to insert plan update', insertError);
    return NextResponse.json({ error: 'Unable to submit update.' }, { status: 500 });
  }

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'update_opened',
    entityType: 'plan',
    entityId: planId,
    meta: {
      plan_update_id: update.id,
    },
  });

  return NextResponse.json({ id: update.id, created_at: update.created_at });
}
