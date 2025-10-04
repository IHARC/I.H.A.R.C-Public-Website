import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { Database } from '@/types/supabase';

export type PortalProfile = Database['portal']['Tables']['profiles']['Row'];

export async function ensurePortalProfile(userId: string, defaults?: Partial<PortalProfile>) {
  const supabase = createSupabaseServiceClient();
  const portal = supabase.schema('portal');

  const { data, error } = await portal
    .from('profiles')
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

  const { data: inserted, error: insertError } = await portal
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: displayName,
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

export async function getUserEmailForProfile(profileId: string) {
  const supabase = createSupabaseServiceClient();
  const portal = supabase.schema('portal');

  const { data: profile, error } = await portal
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!profile?.user_id) {
    return null;
  }

  const { data, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);

  if (userError) {
    throw userError;
  }

  return data.user?.email ?? null;
}
