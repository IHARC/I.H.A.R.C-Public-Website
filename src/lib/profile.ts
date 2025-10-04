import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { Database } from '@/types/supabase';

export type PortalProfile = Database['portal']['Tables']['profiles']['Row'];

export async function ensurePortalProfile(userId: string, defaults?: Partial<PortalProfile>) {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('portal.profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const displayName = defaults?.display_name ?? 'Community Member';
  const role = defaults?.role ?? 'user';

  const { data: inserted, error: insertError } = await supabase
    .from('portal.profiles')
    .insert({
      user_id: userId,
      display_name,
      role,
      organization_id: defaults?.organization_id ?? null,
      rules_acknowledged_at: defaults?.rules_acknowledged_at ?? null,
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}
