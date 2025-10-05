import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { sanitizeForAudit } from '@/lib/safety';

type AuditPayload = {
  actorProfileId?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  meta?: Record<string, unknown>;
};

export async function logAuditEvent(
  supabase: SupabaseClient<Database>,
  { actorProfileId = null, action, entityType, entityId, meta }: AuditPayload,
) {
  const sanitizedMeta = meta ? sanitizeForAudit(meta) : {};
  const metaJson = sanitizedMeta as Json;
  const { error } = await supabase.rpc('portal_log_audit_event', {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_meta: metaJson,
    p_actor_profile_id: actorProfileId,
  });

  if (error) {
    throw error;
  }
}
