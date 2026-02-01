import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AdminCheckResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function requireIharcAdmin(
  supabase: SupabaseClient,
  userId: string,
  context: string,
): Promise<AdminCheckResult> {
  const { data, error } = await supabase.schema('core').rpc('is_global_admin', { p_user: userId });
  if (error) {
    console.error(`${context} admin check error`, error);
    return { ok: false, error: 'Unauthorized', status: 403 };
  }
  if (data !== true) {
    return { ok: false, error: 'Insufficient permissions', status: 403 };
  }
  return { ok: true };
}
