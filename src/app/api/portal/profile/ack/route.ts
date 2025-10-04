import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensurePortalProfile(user.id);

  if (!profile.rules_acknowledged_at) {
    const { error: updateError } = await supabase
      .from('portal.profiles')
      .update({ rules_acknowledged_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to persist rules acknowledgement', updateError);
      return NextResponse.json({ error: 'Unable to save acknowledgement' }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent');
    const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId: user.id,
      action: 'rules_acknowledged',
      entityType: 'profile',
      entityId: profile.id,
      meta: {
        ip_hash: ipHash,
        user_agent: userAgent ?? null,
      },
    });
  }

  const refreshedProfile = await ensurePortalProfile(user.id);

  return NextResponse.json({
    acknowledgedAt: refreshedProfile.rules_acknowledged_at,
  });
}
