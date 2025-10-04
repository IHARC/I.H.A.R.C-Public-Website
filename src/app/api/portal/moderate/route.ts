import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';

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

  return NextResponse.json({ status: 'ok' });
}
