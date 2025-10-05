import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile } from '@/lib/profile';
import { scanContentForSafety } from '@/lib/safety';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

const IDEA_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_METRICS = 6;

interface MetricDraft {
  label: string;
  definition: string | null;
  baseline: string | null;
  target: string | null;
}

export async function PATCH(
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    console.error('Failed to parse form data', error);
    return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 });
  }

  const title = (formData.get('title') as string | null)?.trim();
  const problemStatement = (formData.get('problem_statement') as string | null)?.trim();
  const evidence = (formData.get('evidence') as string | null)?.trim();
  const proposalSummary = (formData.get('proposal_summary') as string | null)?.trim();
  const implementationSteps = (formData.get('implementation_steps') as string | null)?.trim();
  const risks = (formData.get('risks') as string | null)?.trim();
  const metricsRaw = (formData.get('metrics') as string | null) ?? '[]';
  const category = (formData.get('category') as string | null)?.trim();
  const tagsRaw = (formData.get('tags') as string | null) ?? '';
  const isAnonymous = (formData.get('is_anonymous') as string) === 'true';
  const acknowledged = (formData.get('acknowledged') as string) === 'true';
  const attachments = formData.getAll('attachments') as File[];

  if (attachments.length) {
    return NextResponse.json(
      { error: 'Attachment updates are not yet supported when completing an idea.' },
      { status: 422 },
    );
  }

  const profile = await ensurePortalProfile(user.id);

  const { data: existingIdea, error: ideaError } = await portal
    .from('ideas')
    .select('id, author_profile_id, status, publication_status')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Failed to load idea', ideaError);
    return NextResponse.json({ error: 'Unable to load idea' }, { status: 500 });
  }

  if (!existingIdea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  if (existingIdea.author_profile_id !== profile.id && profile.role !== 'moderator' && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only the author can complete this idea.' }, { status: 403 });
  }

  const rateLimit = await checkRateLimit({
    profileId: profile.id,
    type: 'idea_update',
    limit: 20,
    cooldownMs: IDEA_COOLDOWN_MS,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'You are updating ideas too quickly. Please wait a moment and try again.',
        retry_in_ms: rateLimit.retryInMs,
      },
      { status: 429 },
    );
  }

  if (!title || title.length > 120) {
    return NextResponse.json({ error: 'Add a concise title under 120 characters.' }, { status: 422 });
  }

  if (!category) {
    return NextResponse.json({ error: 'Choose a focus area for your idea.' }, { status: 422 });
  }

  if (!problemStatement || !proposalSummary || !implementationSteps) {
    return NextResponse.json(
      { error: 'Problem, proposal, and steps are required to complete this idea.' },
      { status: 422 },
    );
  }

  if (!evidence) {
    return NextResponse.json({ error: 'Evidence is required before publishing.' }, { status: 422 });
  }

  let metricsPayload: MetricDraft[] = [];
  try {
    const parsed = JSON.parse(metricsRaw);
    if (!Array.isArray(parsed)) {
      throw new Error('Metrics payload must be an array');
    }
    metricsPayload = parsed
      .slice(0, MAX_METRICS)
      .map((metric) => {
        const label = typeof metric?.label === 'string' ? metric.label.trim() : '';
        const definition = typeof metric?.definition === 'string' ? metric.definition.trim() : '';
        const baseline = typeof metric?.baseline === 'string' ? metric.baseline.trim() : '';
        const target = typeof metric?.target === 'string' ? metric.target.trim() : '';
        return {
          label,
          definition: definition || null,
          baseline: baseline || null,
          target: target || null,
        } satisfies MetricDraft;
      })
      .filter((metric) => metric.label);
  } catch (error) {
    console.error('Invalid metrics payload', error);
    return NextResponse.json({ error: 'Unable to parse metrics input.' }, { status: 400 });
  }

  if (!metricsPayload.length) {
    return NextResponse.json({ error: 'Add at least one success metric before completing the idea.' }, { status: 422 });
  }

  const invalidMetric = metricsPayload.find((metric) => {
    if (metric.label.length < 3 || metric.label.length > 160) {
      return true;
    }
    if (metric.definition && metric.definition.length > 500) {
      return true;
    }
    return false;
  });
  if (invalidMetric) {
    return NextResponse.json(
      { error: 'Each metric needs a concise title (3-160 chars) and optional notes up to 500 chars.' },
      { status: 422 },
    );
  }

  const tags = tagsRaw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

  const metricsAggregate = metricsPayload
    .map((metric) => `${metric.label} ${metric.definition ?? ''} ${metric.baseline ?? ''} ${metric.target ?? ''}`.trim())
    .join('\n');

  const safetyAggregate = [
    title,
    problemStatement,
    evidence,
    proposalSummary,
    implementationSteps,
    risks ?? '',
    metricsAggregate,
  ]
    .filter(Boolean)
    .join('\n');

  const safety = scanContentForSafety(safetyAggregate);
  if (safety.hasPii || safety.hasProfanity) {
    return NextResponse.json({ error: 'Remove personal information or flagged language before submitting.' }, { status: 400 });
  }

  const metricsSummary = metricsPayload
    .map((metric) => {
      const qualifier = metric.definition ? ` — ${metric.definition}` : '';
      const meta = [
        metric.baseline ? `Baseline: ${metric.baseline}` : null,
        metric.target ? `Target: ${metric.target}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return `• ${metric.label}${qualifier}${meta ? ` (${meta})` : ''}`;
    })
    .join('\n');

  const synthesizedBody = [
    `Problem:\n${problemStatement}`,
    `Evidence:\n${evidence}`,
    `Proposal:\n${proposalSummary}`,
    `Steps:\n${implementationSteps}`,
    risks ? `Risks:\n${risks}` : null,
    metricsSummary ? `Success metrics:\n${metricsSummary}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  const supabaseService = createSupabaseServiceClient();

  const { error: updateError } = await portal
    .from('ideas')
    .update({
      title,
      body: synthesizedBody,
      problem_statement: problemStatement,
      evidence,
      proposal_summary: proposalSummary,
      implementation_steps: implementationSteps,
      risks: risks ?? null,
      success_metrics: metricsSummary,
      category,
      tags,
      is_anonymous: isAnonymous,
      publication_status: 'published',
    })
    .eq('id', ideaId);

  if (updateError) {
    console.error('Failed to update idea', updateError);
    return NextResponse.json({ error: 'Unable to update idea' }, { status: 500 });
  }

  const { error: editError } = await portal.from('idea_edits').insert({
    idea_id: ideaId,
    editor_profile_id: profile.id,
    body: JSON.stringify({
      problem_statement: problemStatement,
      evidence,
      proposal_summary: proposalSummary,
      implementation_steps: implementationSteps,
      risks,
      success_metrics: metricsSummary,
    }),
  });

  if (editError) {
    console.error('Failed to insert idea history', editError);
  }

  const { error: deleteMetricsError } = await supabaseService
    .schema('portal')
    .from('idea_metrics')
    .delete()
    .eq('idea_id', ideaId);

  if (deleteMetricsError) {
    console.error('Failed to delete old metrics', deleteMetricsError);
    return NextResponse.json({ error: 'Unable to refresh metrics. Try again shortly.' }, { status: 500 });
  }

  const metricRows = metricsPayload.map((metric) => ({
    id: randomUUID(),
    idea_id: ideaId,
    metric_label: metric.label,
    success_definition: metric.definition,
    baseline: metric.baseline,
    target: metric.target,
  }));

  const { error: metricInsertError } = await supabaseService
    .schema('portal')
    .from('idea_metrics')
    .insert(metricRows);

  if (metricInsertError) {
    console.error('Failed to insert updated metrics', metricInsertError);
    return NextResponse.json({ error: 'Unable to save metrics. Try again shortly.' }, { status: 500 });
  }

  if (acknowledged && !profile.rules_acknowledged_at) {
    const { error: ackError } = await portal
      .from('profiles')
      .update({ rules_acknowledged_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (ackError) {
      console.error('Failed to persist rules acknowledgement', ackError);
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId: user.id,
    action: 'idea_updated',
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      category,
      tags,
      is_anonymous: isAnonymous,
      metrics_count: metricsPayload.length,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
      publication_status: 'published',
    },
  });

  return NextResponse.json({ id: ideaId });
}
