import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { checkRateLimit } from '@/lib/rate-limit';
import { scanContentForSafety } from '@/lib/safety';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

const OFFICIAL_ROLES = new Set(['org_rep', 'moderator', 'admin']);
const COMMENT_COOLDOWN_MS = 30 * 1000;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ideaId = params.id;
  if (!ideaId) {
    return NextResponse.json({ error: 'Idea id is required' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { body?: unknown; parent_id?: unknown; is_official?: unknown; comment_type?: unknown };
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

  const profile = await ensurePortalProfile(user.id);

  if (!profile.rules_acknowledged_at) {
    return NextResponse.json({ error: 'Please acknowledge the community rules before posting.' }, { status: 412 });
  }

  if (!profile.display_name_confirmed_at) {
    return NextResponse.json({ error: 'Please confirm your display name before posting.' }, { status: 412 });
  }

  const withinLimit = await checkRateLimit({
    profileId: profile.id,
    type: 'comment',
    limit: 20,
    cooldownMs: COMMENT_COOLDOWN_MS,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: 'You are commenting very quickly. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  const { data: idea, error: ideaError } = await supabase
    .from('portal.ideas')
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
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from('portal.comments')
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

  const isOfficial = wantsOfficial && OFFICIAL_ROLES.has(profile.role ?? '');

  let commentType: 'question' | 'suggestion' | 'response' | 'official_note';

  if (isOfficial) {
    commentType = normalizedType && ['response', 'official_note'].includes(normalizedType)
      ? normalizedType
      : 'response';
  } else {
    commentType = normalizedType && ['question', 'suggestion'].includes(normalizedType)
      ? normalizedType
      : 'suggestion';
  }

  const { data: insertedComment, error: insertError } = await supabase
    .from('portal.comments')
    .insert({
      idea_id: ideaId,
      author_profile_id: profile.id,
      parent_comment_id: parentId,
      body,
      is_official: isOfficial,
      comment_type: commentType,
    })
    .select('id, created_at, body, is_official, parent_comment_id')
    .single();

  if (insertError) {
    console.error('Failed to insert comment', insertError);
    return NextResponse.json({ error: 'Unable to post comment' }, { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId: user.id,
    action: isOfficial ? 'comment_official_posted' : 'comment_posted',
    entityType: 'comment',
    entityId: insertedComment.id,
    meta: {
      idea_id: ideaId,
      parent_comment_id: parentId,
      is_official: isOfficial,
      comment_type: commentType,
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
  });
}
