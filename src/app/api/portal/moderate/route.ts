import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile, getUserEmailForProfile } from '@/lib/profile';
import { queuePortalNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(user.id);
  if (!['moderator', 'admin', 'org_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await supabase.functions.invoke('portal-moderate', {
    body: payload,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });

  if (response.error) {
    console.error(response.error);
    return NextResponse.json({ error: 'Moderation failed' }, { status: 500 });
  }

  await handleFollowUps(payload, profile.id);

  return NextResponse.json({ status: 'ok' });
}

async function handleFollowUps(payload: unknown, actorProfileId: string) {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  const body = payload as Record<string, unknown>;
  const action = body.action;

  if (action !== 'update_status') {
    return;
  }

  const ideaId = typeof body.idea_id === 'string' ? body.idea_id : null;
  const note = typeof body.note === 'string' ? body.note : null;
  const status = typeof body.status === 'string' ? body.status : null;

  if (!ideaId || !status) {
    return;
  }

  const service = createSupabaseServiceClient();
  const { data: idea } = await service
    .from('portal.ideas')
    .select('id, title, author_profile_id')
    .eq('id', ideaId)
    .maybeSingle();

  if (!idea?.author_profile_id) {
    return;
  }

  try {
    const email = await getUserEmailForProfile(idea.author_profile_id);
    if (!email) return;

    await queuePortalNotification({
      profileId: idea.author_profile_id,
      email,
      subject: 'Idea status updated',
      bodyText: `"${idea.title}" is now ${status.replace(/_/g, ' ')}. ${note ? `\n\nModerator note: ${note}` : ''}`,
      bodyHtml: `<p><strong>${idea.title}</strong> is now <em>${status.replace(/_/g, ' ')}</em>.</p>${note ? `<p>Moderator note: ${note}</p>` : ''}`,
      ideaId,
      type: 'status_change',
      payload: {
        status,
        note,
        actor_profile_id: actorProfileId,
      },
    });
  } catch (error) {
    console.error('Failed to queue status-change notification', error);
  }
}
