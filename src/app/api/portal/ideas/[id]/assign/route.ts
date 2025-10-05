import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile, getUserEmailForProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { queuePortalNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const ideaIndex = segments.findIndex((segment) => segment === 'ideas');
  const ideaId = ideaIndex >= 0 ? segments[ideaIndex + 1] : null;
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
    return NextResponse.json({ error: 'Only moderators can assign ideas.' }, { status: 403 });
  }

  let payload: { assignee_profile_id?: unknown };
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid assignment payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const rawAssignee = payload.assignee_profile_id;
  let assigneeProfileId: string | null;

  if (rawAssignee === null || rawAssignee === '') {
    assigneeProfileId = null;
  } else if (rawAssignee === 'self') {
    assigneeProfileId = profile.id;
  } else if (typeof rawAssignee === 'string') {
    assigneeProfileId = rawAssignee;
  } else {
    return NextResponse.json({ error: 'Invalid assignee id' }, { status: 422 });
  }

  const portal = supabase.schema('portal');

  const { error: updateError } = await portal
    .from('ideas')
    .update({ assignee_profile_id: assigneeProfileId })
    .eq('id', ideaId);

  if (updateError) {
    console.error('Failed to assign idea', updateError);
    return NextResponse.json({ error: 'Assignment failed' }, { status: 500 });
  }

  let assigneeEmail: string | null = null;
  let assigneeDisplayName: string | null = null;

  if (assigneeProfileId) {
    const { data: assigneeProfile, error: profileError } = await portal
      .from('profiles')
      .select('display_name')
      .eq('id', assigneeProfileId)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load assignee profile', profileError);
    } else {
      assigneeDisplayName = assigneeProfile?.display_name ?? null;
    }

    try {
      assigneeEmail = await getUserEmailForProfile(supabase, assigneeProfileId);
    } catch (emailError) {
      console.error('Failed to resolve assignee email', emailError);
    }
  }

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'idea_assigned',
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      assignee_profile_id: assigneeProfileId,
      assignee_display_name: assigneeDisplayName,
    },
  });

  if (assigneeProfileId && assigneeEmail) {
    try {
      await queuePortalNotification(supabase, {
        profileId: assigneeProfileId,
        email: assigneeEmail,
        subject: 'You have been assigned a community idea',
        bodyText: `A moderator assigned you to follow up on Idea ${ideaId}.`,
        bodyHtml: `<p>A moderator assigned you to follow up on Idea ${ideaId}.</p>`,
        ideaId,
        type: 'assignment',
        payload: { assignee_display_name: assigneeDisplayName },
      });
    } catch (notificationError) {
      console.error('Failed to queue assignment notification', notificationError);
    }
  }

  return NextResponse.json({ status: 'assigned', assignee_profile_id: assigneeProfileId });
}
