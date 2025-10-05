import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile, getUserEmailForProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { queuePortalNotification } from '@/lib/notifications';

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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  if (!['moderator', 'admin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Only moderators can request revisions.' }, { status: 403 });
  }

  let payload: { message?: unknown };
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid revision payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!message) {
    return NextResponse.json({ error: 'Revision message is required' }, { status: 422 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Revision messages are limited to 2000 characters' }, { status: 422 });
  }

  const portal = supabase.schema('portal');

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select('author_profile_id, title')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Failed to load idea before revision request', ideaError);
    return NextResponse.json({ error: 'Unable to request revision' }, { status: 500 });
  }

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const { error: decisionError } = await portal.from('idea_decisions').insert({
    idea_id: ideaId,
    author_profile_id: profile.id,
    summary: message,
    visibility: 'author',
  });

  if (decisionError) {
    console.error('Failed to log revision note', decisionError);
    return NextResponse.json({ error: 'Unable to request revision' }, { status: 500 });
  }

  const { error: statusError } = await portal
    .from('ideas')
    .update({ status: 'new' })
    .eq('id', ideaId);

  if (statusError) {
    console.error('Failed to reset idea status after revision request', statusError);
    return NextResponse.json({ error: 'Unable to request revision' }, { status: 500 });
  }

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'idea_revision_requested',
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      message,
    },
  });

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'idea_status_new',
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      source: 'revision_request',
    },
  });

  if (idea.author_profile_id) {
    try {
      const email = await getUserEmailForProfile(supabase, idea.author_profile_id);
      if (email) {
        await queuePortalNotification(supabase, {
          profileId: idea.author_profile_id,
          email,
          subject: 'Updates requested for your community idea',
          bodyText: message,
          bodyHtml: `<p>${message}</p>`,
          ideaId,
          type: 'revision_request',
          payload: { message },
        });
      }
    } catch (notifyError) {
      console.error('Failed to queue revision notification', notifyError);
    }
  }

  return NextResponse.json({ status: 'revision_requested' });
}
