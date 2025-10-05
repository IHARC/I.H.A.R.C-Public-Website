import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { checkRateLimit } from '@/lib/rate-limit';
import { scanContentForSafety } from '@/lib/safety';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

const OFFICIAL_ROLES = new Set(['org_rep', 'moderator', 'admin']);
const COMMENT_COOLDOWN_MS = 30 * 1000;

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const ideaIndex = segments.findIndex((segment) => segment === 'ideas');
  const ideaId = ideaIndex >= 0 ? segments[ideaIndex + 1] : null;
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

  let payload: {
    body?: unknown;
    parent_id?: unknown;
    is_official?: unknown;
    comment_type?: unknown;
    evidence_url?: unknown;
  };
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid comment payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const parentId = typeof payload.parent_id === 'string' ? payload.parent_id : null;
  const wantsOfficial = Boolean(payload.is_official);
  const rawCommentType = typeof payload.comment_type === 'string' ? payload.comment_type : null;
  const rawEvidenceUrl = typeof payload.evidence_url === 'string' ? payload.evidence_url.trim() : null;

  if (!body) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 422 });
  }

  if (body.length > 2000) {
    return NextResponse.json({ error: 'Comments are limited to 2000 characters' }, { status: 422 });
  }

  const normalizedType = rawCommentType?.toLowerCase() as
    | 'question'
    | 'suggestion'
    | 'response'
    | 'official_note'
    | null;

  const safety = scanContentForSafety(body);
  if (safety.hasPii || safety.hasProfanity) {
    return NextResponse.json(
      { error: 'Remove personal information or flagged language before posting.' },
      { status: 400 },
    );
  }

  const profile = await ensurePortalProfile(supabase, user.id);

  let viewerOrganization: { name: string | null; verified: boolean } | null = null;
  if (profile.organization_id) {
    const { data: organizationRow, error: organizationError } = await portal
      .from('organizations')
      .select('name, verified')
      .eq('id', profile.organization_id)
      .maybeSingle();

    if (organizationError) {
      console.error('Failed to load organization for comment', organizationError);
      return NextResponse.json({ error: 'Unable to verify organization status.' }, { status: 500 });
    }

    if (organizationRow) {
      viewerOrganization = {
        name: organizationRow.name ?? null,
        verified: Boolean(organizationRow.verified),
      };
    }
  }

  if (!profile.rules_acknowledged_at) {
    return NextResponse.json({ error: 'Please acknowledge the community rules before posting.' }, { status: 412 });
  }

  if (!profile.display_name_confirmed_at) {
    return NextResponse.json({ error: 'Please confirm your display name before posting.' }, { status: 412 });
  }

  const rateLimit = await checkRateLimit({
    supabase,
    type: 'comment',
    limit: 20,
    cooldownMs: COMMENT_COOLDOWN_MS,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'You are commenting very quickly. Please wait a few minutes and try again.',
        retry_in_ms: rateLimit.retryInMs,
      },
      { status: 429 },
    );
  }

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select('id, status')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Failed to load idea before commenting', ideaError);
    return NextResponse.json({ error: 'Unable to post comment' }, { status: 500 });
  }

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  if (idea.status === 'archived') {
    return NextResponse.json({ error: 'Comments are disabled for archived ideas' }, { status: 400 });
  }

  let parentDepth = 0;
  let evidenceUrl: string | null = null;
  if (parentId) {
    const { data: parent, error: parentError } = await portal
      .from('comments')
      .select('id, idea_id, depth')
      .eq('id', parentId)
      .maybeSingle();

    if (parentError) {
      console.error('Failed to load parent comment', parentError);
      return NextResponse.json({ error: 'Unable to post reply' }, { status: 500 });
    }

    if (!parent || parent.idea_id !== ideaId) {
      return NextResponse.json({ error: 'Reply target no longer exists' }, { status: 409 });
    }

    parentDepth = parent.depth ?? 0;
    if (!OFFICIAL_ROLES.has(profile.role ?? '')) {
      return NextResponse.json({ error: 'Only official accounts can reply to existing comments.' }, { status: 403 });
    }

    if (parentDepth >= 2) {
      return NextResponse.json({ error: 'Replies are limited to two levels deep' }, { status: 409 });
    }
  }

  const canAttemptOfficial = wantsOfficial && OFFICIAL_ROLES.has(profile.role ?? '');

  let commentType: 'question' | 'suggestion' | 'response' | 'official_note';

  let isOfficial = canAttemptOfficial;

  if (canAttemptOfficial) {
    if (profile.role === 'org_rep' && !viewerOrganization?.verified) {
      return NextResponse.json(
        { error: 'Only verified organizations can post official responses.' },
        { status: 403 },
      );
    }

    commentType = normalizedType && ['response', 'official_note'].includes(normalizedType)
      ? normalizedType
      : 'response';
  } else {
    commentType = normalizedType && ['question', 'suggestion'].includes(normalizedType)
      ? normalizedType
      : 'suggestion';
    isOfficial = false;
  }

  if (rawEvidenceUrl) {
    try {
      const parsed = new URL(rawEvidenceUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      if (rawEvidenceUrl.length > 600) {
        throw new Error('Evidence link too long');
      }
      evidenceUrl = parsed.toString();
    } catch (error) {
      console.error('Invalid evidence URL', error);
      return NextResponse.json(
        { error: 'Provide a valid evidence link starting with http:// or https://.' },
        { status: 422 },
      );
    }
  }

  if (commentType !== 'suggestion') {
    evidenceUrl = null;
  }

  const { data: insertedComment, error: insertError } = await portal
    .from('comments')
    .insert({
      idea_id: ideaId,
      author_profile_id: profile.id,
      parent_comment_id: parentId,
      body,
      is_official: isOfficial,
      comment_type: commentType,
      evidence_url: evidenceUrl,
    })
    .select('id, created_at, body, is_official, parent_comment_id, evidence_url')
    .single();

  if (insertError) {
    console.error('Failed to insert comment', insertError);
    return NextResponse.json({ error: 'Unable to post comment' }, { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: isOfficial ? 'comment_official_posted' : 'comment_posted',
    entityType: 'comment',
    entityId: insertedComment.id,
    meta: {
      idea_id: ideaId,
      parent_comment_id: parentId,
      is_official: isOfficial,
      comment_type: commentType,
      evidence_url: evidenceUrl,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
    },
  });

  return NextResponse.json({
    id: insertedComment.id,
    createdAt: insertedComment.created_at,
    body: insertedComment.body,
    isOfficial,
    parentId: insertedComment.parent_comment_id,
    evidenceUrl: insertedComment.evidence_url,
  });
}
