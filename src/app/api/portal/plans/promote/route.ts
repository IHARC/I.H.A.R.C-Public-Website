import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { PLAN_SUPPORT_THRESHOLD, slugifyPlanSlug } from '@/lib/plans';
import type { Database } from '@/types/supabase';

type IdeaPromotionRecord = Database['portal']['Tables']['ideas']['Row'] & {
  assignee: {
    id: string;
    organization: { name: string; verified: boolean } | null;
  } | null;
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  if (!['moderator', 'admin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Only moderators can promote ideas.' }, { status: 403 });
  }

  let payload: {
    idea_id?: unknown;
    title?: unknown;
    summary?: unknown;
    slug?: unknown;
    focus_areas?: unknown;
    key_date?: unknown;
  };

  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid promotion payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const ideaId = typeof payload.idea_id === 'string' ? payload.idea_id : '';
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const requestedSlug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
  const focusInputs = Array.isArray(payload.focus_areas) ? payload.focus_areas : [];
  const keyDate = payload.key_date as
    | { title?: unknown; date?: unknown; notes?: unknown }
    | undefined;

  if (!ideaId) {
    return NextResponse.json({ error: 'Idea id is required.' }, { status: 422 });
  }

  if (!title) {
    return NextResponse.json({ error: 'Working Plan title is required.' }, { status: 422 });
  }

  if (!summary) {
    return NextResponse.json({ error: 'Provide a plain-language summary for the plan overview.' }, { status: 422 });
  }

  const focusAreas = focusInputs
    .map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry.trim(), summary: null };
      }
      if (entry && typeof entry === 'object') {
        const name = typeof (entry as { name?: unknown }).name === 'string' ? (entry as { name: string }).name.trim() : '';
        const focusSummary = typeof (entry as { summary?: unknown }).summary === 'string'
          ? (entry as { summary: string }).summary.trim()
          : null;
        return { name, summary: focusSummary && focusSummary.length ? focusSummary : null };
      }
      return null;
    })
    .filter((entry) => entry && entry.name.length) as Array<{ name: string; summary: string | null }>;

  if (!focusAreas.length) {
    return NextResponse.json({ error: 'Add at least one focus area before promoting.' }, { status: 422 });
  }

  const keyDateTitle = keyDate && typeof keyDate.title === 'string' ? keyDate.title.trim() : '';
  const keyDateValue = keyDate && typeof keyDate.date === 'string' ? keyDate.date : '';
  const keyDateNotes = keyDate && typeof keyDate.notes === 'string' ? keyDate.notes.trim() : null;

  if (!keyDateTitle || !keyDateValue) {
    return NextResponse.json({ error: 'Provide the first key date title and calendar date.' }, { status: 422 });
  }

  const portal = supabase.schema('portal');

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select(
      `id, vote_count, problem_statement, evidence, proposal_summary, implementation_steps, success_metrics, assignee:assignee_profile_id(
        id,
        organization:organization_id(name, verified)
      )`
    )
    .eq('id', ideaId)
    .maybeSingle<IdeaPromotionRecord>();

  if (ideaError) {
    console.error('Failed to load idea before promotion', ideaError);
    return NextResponse.json({ error: 'Unable to promote idea.' }, { status: 500 });
  }

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found.' }, { status: 404 });
  }

  const infoComplete = Boolean(
    idea.problem_statement &&
      idea.evidence &&
      idea.proposal_summary &&
      idea.implementation_steps &&
      idea.success_metrics,
  );
  const meetsSupportThreshold = (idea.vote_count ?? 0) >= PLAN_SUPPORT_THRESHOLD;
  const hasVerifiedSponsor = Boolean(idea.assignee?.organization?.verified);

  if (!(hasVerifiedSponsor || (meetsSupportThreshold && infoComplete))) {
    return NextResponse.json(
      {
        error:
          'Promotion criteria unmet. Needs a verified sponsor or the support threshold with all sections completed.',
      },
      { status: 422 },
    );
  }

  const baseSlugSource = requestedSlug || title;
  let candidateSlug = slugifyPlanSlug(baseSlugSource);
  if (!candidateSlug) {
    candidateSlug = slugifyPlanSlug(`${title}-${Date.now()}`);
  }

  const { data: existingSlug } = await portal
    .from('plans')
    .select('slug')
    .eq('slug', candidateSlug)
    .maybeSingle();

  if (existingSlug) {
    for (let suffix = 2; ; suffix += 1) {
      const nextSlug = slugifyPlanSlug(`${candidateSlug}-${suffix}`);
      const { data: slugCheck } = await portal.from('plans').select('slug').eq('slug', nextSlug).maybeSingle();
      if (!slugCheck) {
        candidateSlug = nextSlug;
        break;
      }
    }
  }

  const { data: existingPlan } = await portal
    .from('plans')
    .select('id')
    .eq('idea_id', ideaId)
    .maybeSingle();

  if (existingPlan) {
    return NextResponse.json({ error: 'This idea already has a Working Plan.' }, { status: 409 });
  }

  const now = new Date().toISOString();

  const { data: plan, error: planError } = await portal
    .from('plans')
    .insert({
      idea_id: ideaId,
      slug: candidateSlug,
      title,
      canonical_summary: summary,
      created_by_profile_id: profile.id,
      promoted_at: now,
    })
    .select('id')
    .single();

  if (planError || !plan) {
    console.error('Failed to insert plan', planError);
    return NextResponse.json({ error: 'Unable to create Working Plan.' }, { status: 500 });
  }

  const focusPayload = focusAreas.map((focus) => ({
    plan_id: plan.id,
    name: focus.name,
    summary: focus.summary,
  }));

  if (focusPayload.length) {
    const { error: focusError } = await portal.from('plan_focus_areas').insert(focusPayload);
    if (focusError) {
      console.error('Failed to insert focus areas', focusError);
      return NextResponse.json({ error: 'Unable to save focus areas.' }, { status: 500 });
    }
  }

  const { error: keyDateError } = await portal.from('plan_key_dates').insert({
    plan_id: plan.id,
    title: keyDateTitle,
    scheduled_for: keyDateValue,
    notes: keyDateNotes,
    created_by_profile_id: profile.id,
  });

  if (keyDateError) {
    console.error('Failed to insert key date', keyDateError);
    return NextResponse.json({ error: 'Unable to save key date.' }, { status: 500 });
  }

  const { error: ideaUpdateError } = await portal
    .from('ideas')
    .update({ status: 'in_progress' })
    .eq('id', ideaId);

  if (ideaUpdateError) {
    console.error('Failed to update idea status after promotion', ideaUpdateError);
  }

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'plan_promoted',
    entityType: 'plan',
    entityId: plan.id,
    meta: {
      idea_id: ideaId,
      slug: candidateSlug,
    },
  });

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'key_date_set',
    entityType: 'plan',
    entityId: plan.id,
    meta: {
      title: keyDateTitle,
      scheduled_for: keyDateValue,
    },
  });

  return NextResponse.json({ plan_id: plan.id, slug: candidateSlug });
}
