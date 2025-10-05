import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Buffer } from 'node:buffer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { scanContentForSafety } from '@/lib/safety';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
]);
const MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;
const ALLOWED_CATEGORIES = new Set([
  'Housing',
  'Health',
  'Policing',
  'Community',
  'Prevention',
  'Other',
]);

const IDEA_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_METRICS = 6;

type MetricDraft = {
  label: string;
  definition: string | null;
  baseline: string | null;
  target: string | null;
};

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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
  const category = (formData.get('category') as string | null)?.trim();
  const tagsRaw = (formData.get('tags') as string | null) ?? '';
  const isAnonymous = (formData.get('is_anonymous') as string) === 'true';
  const acknowledged = (formData.get('acknowledged') as string) === 'true';
  const attachments = formData.getAll('attachments') as File[];
  const submissionTypeRaw = (formData.get('submission_type') as string | null)?.toLowerCase();
  const submissionType = submissionTypeRaw === 'quick' ? 'quick' : 'full';
  const metricsRaw = (formData.get('metrics') as string | null) ?? '[]';
  let metricsPayload: MetricDraft[] = [];

  if (!title || !category) {
    return NextResponse.json({ error: 'Title and category are required' }, { status: 422 });
  }

  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Unsupported category' }, { status: 422 });
  }

  if (title.length > 120) {
    return NextResponse.json({ error: 'Content exceeds length limits' }, { status: 422 });
  }

  const profile = await ensurePortalProfile(supabase, user.id);

  if (!profile.display_name_confirmed_at) {
    return NextResponse.json(
      { error: 'Please confirm your display name before submitting ideas.' },
      { status: 412 },
    );
  }

  const rateLimit = await checkRateLimit({
    supabase,
    type: 'idea',
    limit: 10,
    cooldownMs: IDEA_COOLDOWN_MS,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'You are posting ideas too quickly. Please wait a few minutes and try again.',
        retry_in_ms: rateLimit.retryInMs,
      },
      { status: 429 },
    );
  }

  if (attachments.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `You can attach up to ${MAX_ATTACHMENTS} files per idea.` },
      { status: 422 },
    );
  }

  const tags = tagsRaw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

  const ideaId = randomUUID();

  if (submissionType === 'quick') {
    const quickSummary = (formData.get('quick_summary') as string | null)?.trim() ?? '';

    if (!quickSummary) {
      return NextResponse.json({ error: 'Share a short description so neighbours understand the idea.' }, { status: 422 });
    }

    if (attachments.length) {
      return NextResponse.json({ error: 'Quick Ideas do not support attachments. Switch to the full form to upload files.' }, { status: 422 });
    }

    const quickAggregate = [title, quickSummary].join('\n');
    const quickSafety = scanContentForSafety(quickAggregate);
    if (quickSafety.hasPii || quickSafety.hasProfanity) {
      return NextResponse.json(
        { error: 'Remove personal information or flagged language before submitting.' },
        { status: 400 },
      );
    }

    const quickBody = [`Summary:\n${quickSummary}`].join('\n\n');

    const { error: insertQuickError } = await portal
      .from('ideas')
      .insert({
        id: ideaId,
        author_profile_id: profile.id,
        title,
        body: quickBody,
        problem_statement: null,
        evidence: null,
        proposal_summary: quickSummary,
        implementation_steps: null,
        risks: null,
        success_metrics: null,
        category,
        tags,
        is_anonymous: isAnonymous,
        attachments: [],
        publication_status: 'draft',
      });

    if (insertQuickError) {
      console.error('Failed to insert quick idea', insertQuickError);
      return NextResponse.json({ error: 'Unable to save quick idea' }, { status: 500 });
    }

    const { error: quickEditError } = await portal.from('idea_edits').insert({
      idea_id: ideaId,
      editor_profile_id: profile.id,
      body: JSON.stringify({
        proposal_summary: quickSummary,
      }),
    });

    if (quickEditError) {
      console.error('Failed to insert quick idea history', quickEditError);
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

    await logAuditEvent(supabase, {
      actorProfileId: profile.id,
      action: 'idea_created',
      entityType: 'idea',
      entityId: ideaId,
      meta: {
        category,
        tags,
        is_anonymous: isAnonymous,
        submission_type: 'quick',
        ip_hash: ipHash,
        user_agent: userAgent ?? null,
      },
    });

    return NextResponse.json({ id: ideaId, draft: true });
  }

  if (!problemStatement || !proposalSummary || !implementationSteps) {
    return NextResponse.json(
      { error: 'Problem, proposal, and steps are required sections.' },
      { status: 422 },
    );
  }

  if (!evidence) {
    return NextResponse.json(
      { error: 'Evidence is required before submitting.' },
      { status: 422 },
    );
  }

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
    return NextResponse.json(
      { error: 'Add at least one success metric before submitting.' },
      { status: 422 },
    );
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

  const metricsAggregate = metricsPayload
    .map((metric) => [metric.label, metric.definition, metric.baseline, metric.target].filter(Boolean).join(' '))
    .join('\n');

  const safety = scanContentForSafety(
    [title, problemStatement, evidence, proposalSummary, implementationSteps, risks, metricsAggregate]
      .filter(Boolean)
      .join('\n'),
  );
  if (safety.hasPii || safety.hasProfanity) {
    return NextResponse.json(
      { error: 'Remove personal information or flagged language before submitting.' },
      { status: 400 },
    );
  }

  const attachmentMeta: Array<{ path: string; name: string; content_type: string; size: number }> = [];
  const uploadedPaths: string[] = [];

  try {
    for (const file of attachments) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new Error(`Attachment ${file.name} exceeds the 8 MB limit.`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = MIME_EXTENSION[file.type] ?? 'bin';
      const objectPath = `idea/${ideaId}/${randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('portal-attachments')
        .upload(objectPath, buffer, {
          cacheControl: '3600',
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(objectPath);
      attachmentMeta.push({
        path: objectPath,
        name: file.name,
        content_type: file.type,
        size: file.size,
      });
    }
  } catch (error) {
    console.error('Attachment upload failed', error);
    if (uploadedPaths.length) {
      await supabase.storage.from('portal-attachments').remove(uploadedPaths);
    }
    return NextResponse.json({ error: 'Attachment upload failed. Please try again.' }, { status: 500 });
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

  const { error: insertError } = await portal
    .from('ideas')
    .insert({
      id: ideaId,
      author_profile_id: profile.id,
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
      attachments: attachmentMeta,
      publication_status: 'published',
    });

  if (insertError) {
    console.error('Failed to insert idea', insertError);
    if (uploadedPaths.length) {
      await supabase.storage.from('portal-attachments').remove(uploadedPaths);
    }
    return NextResponse.json({ error: 'Unable to save idea' }, { status: 500 });
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

  if (metricsPayload.length) {
    const metricRows = metricsPayload.map((metric) => ({
      idea_id: ideaId,
      metric_label: metric.label,
      success_definition: metric.definition,
      baseline: metric.baseline,
      target: metric.target,
    }));

    const { error: metricError } = await supabase
      .schema('portal')
      .from('idea_metrics')
      .insert(metricRows);

    if (metricError) {
      console.error('Failed to insert idea metrics', metricError);
      await supabase.schema('portal').from('ideas').delete().eq('id', ideaId);
      if (uploadedPaths.length) {
        await supabase.storage.from('portal-attachments').remove(uploadedPaths);
      }
      return NextResponse.json({ error: 'Unable to save idea metrics. Please try again.' }, { status: 500 });
    }
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

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'idea_created',
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      category,
      tags,
      is_anonymous: isAnonymous,
      attachment_count: attachmentMeta.length,
      problem_statement: problemStatement,
      evidence,
      proposal_summary: proposalSummary,
      implementation_steps: implementationSteps,
      risks: risks ?? null,
      metrics_count: metricsPayload.length,
      metrics_summary: metricsSummary,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
    },
  });

  return NextResponse.json({ id: ideaId });
}
