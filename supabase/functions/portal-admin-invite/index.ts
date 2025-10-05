import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

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
const PORTAL_EMAIL_FROM = Deno.env.get('PORTAL_EMAIL_FROM') ?? 'IHARC Command Center <notifications@iharc.example>';
const SMTP_HOST = Deno.env.get('PORTAL_SMTP_HOST');
const SMTP_PORT = Number(Deno.env.get('PORTAL_SMTP_PORT') ?? '587');
const SMTP_USERNAME = Deno.env.get('PORTAL_SMTP_USERNAME');
const SMTP_PASSWORD = Deno.env.get('PORTAL_SMTP_PASSWORD');
const SMTP_SECURE = (Deno.env.get('PORTAL_SMTP_SECURE') ?? 'true').toLowerCase() === 'true';

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
    .select('id, role, display_name')
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

  const { data: inviteRecord, error: insertError } = await supabase
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
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('portal-admin-invite failed to persist invite', insertError);
    return jsonResponse({ error: 'Unable to record invite' }, 500);
  }

  const organizationName = orgId
    ? await loadOrganizationName(orgId)
    : null;

  const emailResult = await sendPortalInviteEmail({
    inviteId: inviteRecord?.id ?? null,
    recipientEmail: email,
    recipientDisplayName: displayName,
    affiliationType,
    organizationName,
    message,
    inviterProfileId: profile.id,
    inviterDisplayName: profile.display_name ?? null,
  });

  if (!emailResult.ok) {
    return jsonResponse({ error: 'Unable to send invite email' }, 500);
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

async function loadOrganizationName(organizationId: string) {
  const { data, error } = await supabase
    .from('portal.organizations')
    .select('name')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('portal-admin-invite failed to load organization', error);
    return null;
  }

  return data?.name ?? null;
}

type SendPortalInviteArgs = {
  inviteId: string | null;
  recipientEmail: string;
  recipientDisplayName: string | null;
  affiliationType: string;
  organizationName: string | null;
  message: string | null;
  inviterProfileId: string;
  inviterDisplayName: string | null;
};

async function sendPortalInviteEmail(args: SendPortalInviteArgs) {
  if (!SMTP_HOST) {
    await logInviteEmailFailure(args, 'SMTP host not configured for portal-admin-invite');
    return { ok: false } as const;
  }

  let client: SMTPClient | null = null;

  const inviterName = args.inviterDisplayName ?? 'the IHARC Command Center team';
  const greetingName = args.recipientDisplayName ?? null;
  const greeting = greetingName ? `Hello ${greetingName},` : 'Hello,';
  const affiliationLabel = formatAffiliation(args.affiliationType);
  const orgLine = args.organizationName ? `This invitation is on behalf of ${args.organizationName}.` : null;
  const sharedMessage = args.message ? args.message.trim() : '';

  const textBody = [
    greeting,
    '',
    `${inviterName} invited you to collaborate on the IHARC Command Center as a ${affiliationLabel}.`,
    orgLine ?? undefined,
    sharedMessage ? `Message from ${inviterName}:\n${sharedMessage}` : undefined,
    '',
    'Use the "Accept invite" link in the Supabase email you just received to set your password and sign in with this address.',
    'Once you are signed in, you can confirm your profile and join plan coordination threads with neighbours and partners.',
    '',
    'If anything is unclear or you run into issues, reply to this message and we will help right away.',
    '',
    'In solidarity,',
    `${inviterName} and the IHARC Command Center moderation team`,
  ]
    .filter((line) => typeof line === 'string')
    .join('\n');

  const htmlBody = buildInviteHtml({
    greeting,
    inviterName,
    affiliationLabel,
    orgLine,
    sharedMessage,
  });

  try {
    client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_SECURE,
        auth: SMTP_USERNAME && SMTP_PASSWORD
          ? { username: SMTP_USERNAME, password: SMTP_PASSWORD }
          : undefined,
      },
    });

    await client.send({
      from: PORTAL_EMAIL_FROM,
      to: args.recipientEmail,
      subject: 'Invitation to join the IHARC Command Center',
      content: textBody,
      html: htmlBody,
    });
    return { ok: true } as const;
  } catch (error) {
    console.error('portal-admin-invite failed to send SMTP email', error);
    await logInviteEmailFailure(args, error);
    return { ok: false } as const;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('portal-admin-invite failed to close SMTP client', closeError);
      }
    }
  }
}

function formatAffiliation(type: string) {
  switch (type) {
    case 'community_member':
      return 'community collaborator';
    case 'government_partner':
      return 'government partner';
    case 'agency_partner':
    default:
      return 'service partner';
  }
}

function buildInviteHtml(args: {
  greeting: string;
  inviterName: string;
  affiliationLabel: string;
  orgLine: string | null;
  sharedMessage: string;
}) {
  const parts: string[] = [];
  parts.push(`<p>${escapeHtml(args.greeting)}</p>`);
  parts.push(
    `<p>${escapeHtml(args.inviterName)} invited you to collaborate on the IHARC Command Center as a ${escapeHtml(args.affiliationLabel)}.</p>`,
  );
  if (args.orgLine) {
    parts.push(`<p>${escapeHtml(args.orgLine)}</p>`);
  }
  if (args.sharedMessage) {
    parts.push(
      `<p><strong>Message from ${escapeHtml(args.inviterName)}:</strong><br />${escapeHtml(args.sharedMessage).replace(/\n/g, '<br />')}</p>`,
    );
  }
  parts.push(
    '<p>Use the <em>Accept invite</em> link in the IHARC Command Center email you just received to set your password and sign in with this address.</p>',
  );
  parts.push(
    '<p>Once you are signed in, you can confirm your profile and join plan coordination threads with neighbours and partners.</p>',
  );
  parts.push('<p>If anything is unclear or you run into issues, reply to this message and we will help right away.</p>');
  parts.push(`
    <p>
      In solidarity,<br />
      ${escapeHtml(args.inviterName)} and the IHARC Command Center moderation team
    </p>
  `);
  return parts.join('\n');
}

async function logInviteEmailFailure(args: SendPortalInviteArgs, error: unknown) {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? `${error.name}: ${error.message}`
      : JSON.stringify(error);

  try {
    await supabase.rpc('portal_log_audit_event', {
      p_action: 'profile_invite_email_failed',
      p_entity_type: 'profile_invite',
      p_entity_id: args.inviteId ?? args.recipientEmail,
      p_actor_profile_id: args.inviterProfileId,
      p_meta: {
        error: message,
        recipient: args.recipientEmail,
        affiliationType: args.affiliationType,
      },
    });
  } catch (auditError) {
    console.error('portal-admin-invite failed to log email failure audit event', auditError);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
