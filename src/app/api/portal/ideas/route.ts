import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Buffer } from 'node:buffer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
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

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
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
  const successMetrics = (formData.get('success_metrics') as string | null)?.trim();
  const category = (formData.get('category') as string | null)?.trim();
  const tagsRaw = (formData.get('tags') as string | null) ?? '';
  const isAnonymous = (formData.get('is_anonymous') as string) === 'true';
  const acknowledged = (formData.get('acknowledged') as string) === 'true';
  const attachments = formData.getAll('attachments') as File[];

  if (!title || !category) {
    return NextResponse.json({ error: 'Title and category are required' }, { status: 422 });
  }

  if (!problemStatement || !proposalSummary || !implementationSteps) {
    return NextResponse.json(
      { error: 'Problem, proposal, and steps are required sections.' },
      { status: 422 },
    );
  }

  if (!evidence || !successMetrics) {
    return NextResponse.json(
      { error: 'Evidence and success metrics are required before submitting.' },
      { status: 422 },
    );
  }

  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Unsupported category' }, { status: 422 });
  }

  if (title.length > 120) {
    return NextResponse.json({ error: 'Content exceeds length limits' }, { status: 422 });
  }

  const safety = scanContentForSafety(
    [title, problemStatement, evidence, proposalSummary, implementationSteps, risks, successMetrics]
      .filter(Boolean)
      .join('\n'),
  );
  if (safety.hasPii || safety.hasProfanity) {
    return NextResponse.json(
      { error: 'Remove personal information or flagged language before submitting.' },
      { status: 400 },
    );
  }

  const profile = await ensurePortalProfile(user.id);

  if (!profile.display_name_confirmed_at) {
    return NextResponse.json(
      { error: 'Please confirm your display name before submitting ideas.' },
      { status: 412 },
    );
  }

  const withinLimit = await checkRateLimit({
    profileId: profile.id,
    type: 'idea',
    limit: 10,
    cooldownMs: IDEA_COOLDOWN_MS,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: 'You are posting ideas too quickly. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  if (attachments.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `You can attach up to ${MAX_ATTACHMENTS} files per idea.` },
      { status: 422 },
    );
  }

  const supabaseService = createSupabaseServiceClient();
  const ideaId = randomUUID();
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

      const { error: uploadError } = await supabaseService.storage
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
      await supabaseService.storage.from('portal-attachments').remove(uploadedPaths);
    }
    return NextResponse.json({ error: 'Attachment upload failed. Please try again.' }, { status: 500 });
  }

  const tags = tagsRaw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

  const synthesizedBody = [
    `Problem:\n${problemStatement}`,
    `Evidence:\n${evidence}`,
    `Proposal:\n${proposalSummary}`,
    `Steps:\n${implementationSteps}`,
    risks ? `Risks:\n${risks}` : null,
    `Success metrics:\n${successMetrics}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const { error: insertError } = await supabase
    .from('portal.ideas')
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
      success_metrics: successMetrics,
      category,
      tags,
      is_anonymous: isAnonymous,
      attachments: attachmentMeta,
    });

  if (insertError) {
    console.error('Failed to insert idea', insertError);
    if (uploadedPaths.length) {
      await supabaseService.storage.from('portal-attachments').remove(uploadedPaths);
    }
    return NextResponse.json({ error: 'Unable to save idea' }, { status: 500 });
  }

  const { error: editError } = await supabase.from('portal.idea_edits').insert({
    idea_id: ideaId,
    editor_profile_id: profile.id,
    body: JSON.stringify({
      problem_statement: problemStatement,
      evidence,
      proposal_summary: proposalSummary,
      implementation_steps: implementationSteps,
      risks,
      success_metrics: successMetrics,
    }),
  });

  if (editError) {
    console.error('Failed to insert idea history', editError);
  }

  if (acknowledged && !profile.rules_acknowledged_at) {
    const { error: ackError } = await supabase
      .from('portal.profiles')
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
        success_metrics: successMetrics,
        ip_hash: ipHash,
        user_agent: userAgent ?? null,
      },
    });

  return NextResponse.json({ id: ideaId });
}
