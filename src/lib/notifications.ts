import { createSupabaseServiceClient } from '@/lib/supabase/service';

export type QueueNotificationArgs = {
  profileId?: string | null;
  email: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  ideaId?: string;
  type: string;
  payload?: Record<string, unknown>;
};

export async function queuePortalNotification(args: QueueNotificationArgs) {
  const supabase = createSupabaseServiceClient();
  const { profileId = null, email, subject, bodyText, bodyHtml, ideaId, type, payload } = args;

  const { data, error } = await supabase
    .from('portal.notifications')
    .insert({
      profile_id: profileId,
      recipient_email: email,
      subject,
      body_text: bodyText,
      body_html: bodyHtml ?? null,
      idea_id: ideaId ?? null,
      notification_type: type,
      payload: payload ?? {},
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  const alertsSecret = process.env.PORTAL_ALERTS_SECRET;

  if (alertsSecret) {
    try {
      await supabase.functions.invoke('portal-alerts', {
        body: { notificationId: data.id },
        headers: { Authorization: `Bearer ${alertsSecret}` },
      });
    } catch (invokeError) {
      console.error('Failed to invoke portal-alerts edge function', invokeError);
    }
  }

  return data.id;
}
