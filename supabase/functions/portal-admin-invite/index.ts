import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InvitePayload = {
  email?: unknown;
  displayName?: unknown;
  positionTitle?: unknown;
  affiliationType?: unknown;
  organizationId?: unknown;
  message?: unknown;
  actorProfileId?: unknown;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for portal-admin-invite');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ALLOWED_AFFILIATIONS = new Set(['community_member', 'agency_partner', 'government_partner']);

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing bearer token' }, 401);
  }

  const accessToken = authHeader.slice('Bearer '.length);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid token' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('portal.profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'admin') {
    return jsonResponse({ error: 'Insufficient permissions' }, 403);
  }

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error('portal-admin-invite invalid JSON', error);
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : null;
  const positionTitle = typeof payload.positionTitle === 'string' ? payload.positionTitle.trim() : null;
  const orgId = typeof payload.organizationId === 'string' && payload.organizationId ? payload.organizationId : null;
  const message = typeof payload.message === 'string' ? payload.message.trim() : null;
  const affiliationRaw = typeof payload.affiliationType === 'string' ? payload.affiliationType : 'agency_partner';
  const affiliationType = ALLOWED_AFFILIATIONS.has(affiliationRaw) ? affiliationRaw : 'agency_partner';
  const actorProfileId = typeof payload.actorProfileId === 'string' ? payload.actorProfileId : profile.id;

  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'Invite requires a valid email address.' }, 422);
  }

  if (affiliationType !== 'community_member' && (!positionTitle || !positionTitle.length)) {
    return jsonResponse({ error: 'Share the position or role for agency and government partners.' }, 422);
  }

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      invited_via_portal: true,
      invitation_affiliation_type: affiliationType,
    },
  });

  if (inviteError && !inviteError.message?.toLowerCase().includes('already registered')) {
    console.error('portal-admin-invite auth error', inviteError);
    return jsonResponse({ error: 'Unable to send Supabase auth invite' }, 500);
  }

  if (inviteError) {
    console.warn('User already registered, skipping auth invite email');
  }

  const { error: insertError } = await supabase
    .from('portal.profile_invites')
    .insert({
      email,
      display_name: displayName,
      position_title: positionTitle,
      affiliation_type: affiliationType,
      organization_id: orgId,
      message,
      invited_by_profile_id: actorProfileId,
      invited_by_user_id: user.id,
    });

  if (insertError) {
    console.error('portal-admin-invite failed to persist invite', insertError);
    return jsonResponse({ error: 'Unable to record invite' }, 500);
  }

  const auditMeta = {
    affiliationType,
    organizationId: orgId,
    displayName,
  };

  const { error: auditError } = await supabase.rpc('portal_log_audit_event', {
    p_action: 'profile_invite_sent',
    p_entity_type: 'profile_invite',
    p_entity_id: email,
    p_meta: auditMeta,
    p_actor_profile_id: actorProfileId,
  });

  if (auditError) {
    console.error('portal-admin-invite audit error', auditError);
  }

  return jsonResponse({ status: 'sent' }, 200);
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
