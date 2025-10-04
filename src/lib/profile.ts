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
    await syncAuthClaims(supabase, userId, data);
    return data;
  }

  const displayName = defaults?.display_name ?? 'Community Member';
  const role = defaults?.role ?? 'user';
  const positionTitle = defaults?.position_title ?? null;
  const affiliationType = defaults?.affiliation_type ?? 'community_member';
  const affiliationStatus = defaults?.affiliation_status ?? 'approved';
  const affiliationRequestedAt =
    defaults?.affiliation_requested_at ?? (affiliationStatus === 'pending' ? new Date().toISOString() : null);
  const affiliationReviewedAt = defaults?.affiliation_reviewed_at ?? null;
  const affiliationReviewedBy = defaults?.affiliation_reviewed_by ?? null;

  const { data: inserted, error: insertError } = await portal
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: displayName,
      role,
      organization_id: defaults?.organization_id ?? null,
      rules_acknowledged_at: defaults?.rules_acknowledged_at ?? null,
      position_title: positionTitle,
      affiliation_type: affiliationType,
      affiliation_status: affiliationStatus,
      affiliation_requested_at: affiliationRequestedAt,
      affiliation_reviewed_at: affiliationReviewedAt,
      affiliation_reviewed_by: affiliationReviewedBy,
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  await syncAuthClaims(supabase, userId, inserted);

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

async function syncAuthClaims(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  userId: string,
  profile: PortalProfile,
) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        portal_role: profile.role,
        portal_profile_id: profile.id,
        portal_affiliation_type: profile.affiliation_type,
        portal_affiliation_status: profile.affiliation_status,
      },
      user_metadata: {
        display_name: profile.display_name,
        organization_id: profile.organization_id,
        position_title: profile.position_title,
        affiliation_type: profile.affiliation_type,
        affiliation_status: profile.affiliation_status,
      },
    });

    if (error) {
      console.error('Failed to update Supabase auth claims', error);
    }
  } catch (error) {
    console.error('Failed to sync Supabase auth claims', error);
  }
}
