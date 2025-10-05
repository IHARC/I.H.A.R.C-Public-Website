import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const PORTAL_ALERTS_SECRET = Deno.env.get('PORTAL_ALERTS_SECRET');
const EMAIL_FROM = Deno.env.get('PORTAL_EMAIL_FROM') ?? 'IHARC Command Center <notifications@iharc.example>';
const SMTP_HOST = Deno.env.get('PORTAL_SMTP_HOST');
const SMTP_PORT = Number(Deno.env.get('PORTAL_SMTP_PORT') ?? '587');
const SMTP_USERNAME = Deno.env.get('PORTAL_SMTP_USERNAME');
const SMTP_PASSWORD = Deno.env.get('PORTAL_SMTP_PASSWORD');
const SMTP_SECURE = (Deno.env.get('PORTAL_SMTP_SECURE') ?? 'true').toLowerCase() === 'true';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for portal-alerts');
}

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

  if (!PORTAL_ALERTS_SECRET) {
    return new Response(JSON.stringify({ error: 'Alerts secret not configured' }), {
      status: 500,
      headers: responseHeaders(),
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const providedSecret = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : authHeader;

  if (providedSecret !== PORTAL_ALERTS_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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

  const wantsEmail = (notification.channels ?? []).includes('email');

  let newStatus = notification.status;
  let sentAt: string | null = null;

  if (wantsEmail) {
    if (!SMTP_HOST) {
      const errorMessage = 'SMTP host not configured for portal-alerts';
      console.error(errorMessage);
      newStatus = 'failed';
      await logNotificationFailure(notification, errorMessage);
    } else {
      let client: SMTPClient | null = null;
      try {
        client = new SMTPClient({
          connection: {
            hostname: SMTP_HOST,
            port: SMTP_PORT,
            tls: SMTP_SECURE,
            auth: SMTP_USERNAME && SMTP_PASSWORD
              ? {
                  username: SMTP_USERNAME,
                  password: SMTP_PASSWORD,
                }
              : undefined,
          },
        });

        await client.send({
          from: EMAIL_FROM,
          to: notification.recipient_email,
          subject: notification.subject,
          content: notification.body_text,
          html: notification.body_html ?? `<p>${escapeHtml(notification.body_text)}</p>`,
        });

        newStatus = 'sent';
        sentAt = new Date().toISOString();
      } catch (smtpError) {
        console.error('Error sending notification email via SMTP', smtpError);
        newStatus = 'failed';
        await logNotificationFailure(notification, smtpError);
      } finally {
        if (client) {
          try {
            await client.close();
          } catch (closeError) {
            console.error('Failed to close SMTP client', closeError);
          }
        }
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
