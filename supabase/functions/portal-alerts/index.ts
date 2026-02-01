import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAcsEmail } from '../_shared/acs-email.ts';
import { requireAuth } from '../_shared/auth.ts';
import { requireEnv } from '../_shared/env.ts';

type NotificationRecord = {
  id: string;
  recipient_email: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  channels: string[];
  status: string;
  profile_id: string | null;
  notification_type: string;
};

type ActorContext = {
  userId: string;
  userEmail: string | null;
  profileId: string | null;
  canManageNotifications: boolean;
};

const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const PORTAL_EMAIL_SENDER = Deno.env.get('PORTAL_EMAIL_SENDER');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders() });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: responseHeaders(),
    });
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: responseHeaders(),
    });
  }

  let payload: { notificationId?: unknown };
  try {
    payload = await req.json();
  } catch (error) {
    console.error('portal-alerts invalid JSON', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: responseHeaders(),
    });
  }

  const notificationId = typeof payload.notificationId === 'string' ? payload.notificationId : null;
  if (!notificationId) {
    return new Response(JSON.stringify({ error: 'notificationId is required' }), {
      status: 422,
      headers: responseHeaders(),
    });
  }

  const { data: notification, error } = await supabase
    .from('portal.notifications')
    .select('id, recipient_email, subject, body_text, body_html, channels, status, profile_id, notification_type')
    .eq('id', notificationId)
    .maybeSingle();

  if (error) {
    console.error('portal-alerts failed to load notification', error);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: responseHeaders(),
    });
  }

  if (!notification) {
    return new Response(JSON.stringify({ error: 'Notification not found' }), {
      status: 404,
      headers: responseHeaders(),
    });
  }

  if (!notification.recipient_email) {
    return new Response(JSON.stringify({ error: 'Notification has no recipient email' }), {
      status: 422,
      headers: responseHeaders(),
    });
  }

  const actor = await loadActorContext(auth.userId, auth.userEmail);
  if (!actor) {
    return new Response(JSON.stringify({ error: 'Unable to verify notification access' }), {
      status: 500,
      headers: responseHeaders(),
    });
  }

  if (!canSendNotification(actor, notification)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: responseHeaders(),
    });
  }

  const wantsEmail = (notification.channels ?? []).includes('email');

  let newStatus = notification.status;
  let sentAt: string | null = null;

  if (wantsEmail) {
    if (!PORTAL_EMAIL_SENDER) {
      const errorMessage = 'Portal email sender not configured for portal-alerts';
      console.error(errorMessage);
      newStatus = 'failed';
      await logNotificationFailure(notification, errorMessage);
    } else {
      try {
        const subject = notification.subject?.trim() ?? '';
        if (!subject) {
          throw new Error('Notification subject is required');
        }

        await sendAcsEmail({
          senderAddress: PORTAL_EMAIL_SENDER,
          subject,
          plainText: notification.body_text,
          html: notification.body_html ?? `<p>${escapeHtml(notification.body_text)}</p>`,
          to: [{ email: notification.recipient_email }],
        });

        newStatus = 'sent';
        sentAt = new Date().toISOString();
      } catch (smtpError) {
        console.error('Error sending notification email via ACS', smtpError);
        newStatus = 'failed';
        await logNotificationFailure(notification, smtpError);
      }
    }
  } else {
    newStatus = 'sent';
    sentAt = new Date().toISOString();
  }

  await supabase
    .from('portal.notifications')
    .update({ status: newStatus, sent_at: sentAt })
    .eq('id', notification.id);

  return new Response(JSON.stringify({ status: newStatus }), {
    status: 200,
    headers: responseHeaders(),
  });
});

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function responseHeaders() {
  return {
    ...buildCorsHeaders(),
    'Content-Type': 'application/json',
  };
}

function canSendNotification(actor: ActorContext, notification: NotificationRecord): boolean {
  if (actor.canManageNotifications) return true;
  if (actor.profileId && notification.profile_id && actor.profileId === notification.profile_id) return true;
  const actorEmail = normalizeEmail(actor.userEmail);
  const recipientEmail = normalizeEmail(notification.recipient_email);
  return Boolean(actorEmail && recipientEmail && actorEmail === recipientEmail);
}

function normalizeEmail(value: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function logNotificationFailure(notification: NotificationRecord, error: unknown) {
  const errorMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : JSON.stringify(error);

  try {
    await supabase.rpc('portal_log_audit_event', {
      p_action: 'notification_send_failed',
      p_entity_type: 'notification',
      p_entity_id: notification.id,
      p_actor_profile_id: notification.profile_id,
      p_meta: {
        error: errorMessage,
        notificationType: notification.notification_type,
        recipient: notification.recipient_email,
      },
    });
  } catch (auditError) {
    console.error('Failed to log notification failure audit event', auditError);
  }
}

async function loadActorContext(userId: string, userEmail: string | null): Promise<ActorContext | null> {
  const [profileResult, adminResult, permissionResult] = await Promise.all([
    supabase.schema('portal').from('profiles').select('id').eq('user_id', userId).maybeSingle(),
    supabase.schema('core').rpc('is_global_admin', { p_user: userId }),
    supabase.schema('core').rpc('has_iharc_permission', { permission_name: 'portal.manage_notifications', p_user: userId }),
  ]);

  if (profileResult.error) {
    console.error('portal-alerts failed to load actor profile', profileResult.error);
    return null;
  }

  if (adminResult.error) {
    console.error('portal-alerts failed to check global admin', adminResult.error);
    return null;
  }

  if (permissionResult.error) {
    console.error('portal-alerts failed to check notifications permission', permissionResult.error);
    return null;
  }

  return {
    userId,
    userEmail,
    profileId: profileResult.data?.id ?? null,
    canManageNotifications: Boolean(adminResult.data) || Boolean(permissionResult.data),
  };
}
