import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { checkRateLimit } from '@/lib/rate-limit';
import { scanContentForSafety } from '@/lib/safety';
import { logAuditEvent } from '@/lib/audit';
import { hashValue } from '@/lib/hash';

const FLAG_REASONS = new Set(['privacy', 'abuse', 'hate', 'spam', 'wrong_cat', 'other']);
const ENTITY_TYPES = new Set(['idea', 'comment']);

export async function POST(req: NextRequest) {
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
    entity_type?: unknown;
    entity_id?: unknown;
    reason?: unknown;
    details?: unknown;
  };

  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid flag payload', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const entityType = typeof payload.entity_type === 'string' ? payload.entity_type : '';
  const entityId = typeof payload.entity_id === 'string' ? payload.entity_id : '';
  const reason = typeof payload.reason === 'string' ? payload.reason : '';
  const details = typeof payload.details === 'string' ? payload.details.trim() : null;

  if (!ENTITY_TYPES.has(entityType) || !entityId || !FLAG_REASONS.has(reason)) {
    return NextResponse.json({ error: 'Invalid flag submission' }, { status: 422 });
  }

  if (details && details.length > 600) {
    return NextResponse.json({ error: 'Details are limited to 600 characters' }, { status: 422 });
  }

  if (details) {
    const safety = scanContentForSafety(details);
    if (safety.hasPii) {
      return NextResponse.json({ error: 'Do not include personal information in flag details.' }, { status: 400 });
    }
  }

  const profile = await ensurePortalProfile(supabase, user.id);

  const rateLimit = await checkRateLimit({ supabase, type: 'flag', limit: 10 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'You are submitting flags very quickly. Please wait a few minutes and try again.',
        retry_in_ms: rateLimit.retryInMs,
      },
      { status: 429 },
    );
  }

  if (!profile.rules_acknowledged_at) {
    return NextResponse.json({ error: 'Please acknowledge the community rules before reporting content.' }, { status: 412 });
  }

  if (entityType === 'idea') {
    const { data: idea, error: ideaError } = await portal
      .from('ideas')
      .select('id')
      .eq('id', entityId)
      .maybeSingle();
    if (ideaError) {
      console.error('Failed to verify idea for flag', ideaError);
      return NextResponse.json({ error: 'Unable to submit flag' }, { status: 500 });
    }
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
  } else {
    const { data: comment, error: commentError } = await portal
      .from('comments')
      .select('id')
      .eq('id', entityId)
      .maybeSingle();
    if (commentError) {
      console.error('Failed to verify comment for flag', commentError);
      return NextResponse.json({ error: 'Unable to submit flag' }, { status: 500 });
    }
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
  }

  const { data: insertedFlag, error: insertError } = await portal
    .from('flags')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      reporter_profile_id: profile.id,
      reason,
      details,
    })
    .select('id, status')
    .single();

  if (insertError) {
    console.error('Failed to submit flag', insertError);
    return NextResponse.json({ error: 'Unable to submit flag' }, { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const ipHash = ip ? hashValue(ip).slice(0, 32) : null;

  await logAuditEvent(supabase, {
    actorProfileId: profile.id,
    action: 'content_flagged',
    entityType: entityType,
    entityId: entityId,
    meta: {
      reason,
      flag_id: insertedFlag.id,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
    },
  });

  return NextResponse.json({ id: insertedFlag.id, status: insertedFlag.status });
}
