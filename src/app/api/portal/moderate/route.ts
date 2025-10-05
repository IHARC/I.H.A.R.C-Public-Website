import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile, getUserEmailForProfile } from '@/lib/profile';
import { queuePortalNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  if (!['moderator', 'admin', 'org_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: Record<string, unknown>;
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

  await handleFollowUps(supabase, payload, profile.id);

  return NextResponse.json({ status: 'ok' });
}

async function handleFollowUps(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown> | null | undefined,
  actorProfileId: string,
) {
  if (!payload) {
    return;
  }

  const action = typeof payload.action === 'string' ? payload.action : null;

  if (action !== 'update_status') {
    return;
  }

  const ideaId = typeof payload.idea_id === 'string' ? payload.idea_id : null;
  const note = typeof payload.note === 'string' ? payload.note : null;
  const status = typeof payload.status === 'string' ? payload.status : null;

  if (!ideaId || !status) {
    return;
  }

  const portal = supabase.schema('portal');
  const { data: idea } = await portal
    .from('ideas')
    .select('id, title, author_profile_id')
    .eq('id', ideaId)
    .maybeSingle();

  if (!idea?.author_profile_id) {
    return;
  }

  try {
    const email = await getUserEmailForProfile(supabase, idea.author_profile_id);
    if (!email) return;

    await queuePortalNotification(supabase, {
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
