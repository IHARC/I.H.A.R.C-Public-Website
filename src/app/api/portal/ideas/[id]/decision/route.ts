import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile, getUserEmailForProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { queuePortalNotification } from '@/lib/notifications';

type RouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const routeParams = (context.params ? await context.params : {}) as Record<string, string | string[] | undefined>;
  const ideaParam = routeParams.id;
  const ideaId = Array.isArray(ideaParam) ? ideaParam[0] : ideaParam;
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

  const profile = await ensurePortalProfile(user.id);
  if (!['moderator', 'admin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Only moderators can record decisions.' }, { status: 403 });
  }

  let payload: { summary?: unknown; visibility?: unknown };
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid decision payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const visibility = typeof payload.visibility === 'string' ? payload.visibility : 'public';

  if (!summary) {
    return NextResponse.json({ error: 'Decision summary is required' }, { status: 422 });
  }

  if (summary.length > 2000) {
    return NextResponse.json({ error: 'Decision summaries are limited to 2000 characters' }, { status: 422 });
  }

  const service = createSupabaseServiceClient();
  const portal = service.schema('portal');

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select('author_profile_id, title')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Failed to load idea before decision', ideaError);
    return NextResponse.json({ error: 'Unable to record decision' }, { status: 500 });
  }

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const { data: decision, error: insertError } = await portal
    .from('idea_decisions')
    .insert({
      idea_id: ideaId,
      author_profile_id: profile.id,
      summary,
      visibility,
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    console.error('Failed to insert decision record', insertError);
    return NextResponse.json({ error: 'Unable to record decision' }, { status: 500 });
  }

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId: user.id,
    action: 'idea_decision_recorded',
    entityType: 'idea',
    entityId: ideaId,
    meta: {
      summary,
      visibility,
    },
  });

  if (idea.author_profile_id && idea.author_profile_id !== profile.id) {
    try {
      const email = await getUserEmailForProfile(idea.author_profile_id);
      if (email) {
        await queuePortalNotification({
          profileId: idea.author_profile_id,
          email,
          subject: 'A moderator recorded a decision on your idea',
          bodyText: summary,
          bodyHtml: `<p>${summary}</p>`,
          ideaId,
          type: 'decision',
          payload: { summary },
        });
      }
    } catch (notifyError) {
      console.error('Failed to queue decision notification', notifyError);
    }
  }

  return NextResponse.json({ id: decision.id, created_at: decision.created_at });
}
