import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sanitizeForAudit } from '@/lib/safety';

export async function logAuditEvent(params: {
  actorProfileId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  meta?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  const { actorProfileId, actorUserId, action, entityType, entityId, meta } = params;

  await supabase.from('portal.audit_log').insert({
    actor_profile_id: actorProfileId,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    meta: meta ? sanitizeForAudit(meta) : {},
  });
}
