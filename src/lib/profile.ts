import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';

export type PortalProfile = Database['portal']['Tables']['profiles']['Row'];

export async function ensurePortalProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  defaults?: Partial<PortalProfile>,
) {
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
    if (!data.position_title && data.affiliation_type === 'community_member') {
      const { data: updated, error: updateError } = await portal
        .from('profiles')
        .update({ position_title: PUBLIC_MEMBER_ROLE_LABEL })
        .eq('id', data.id)
        .select('*')
        .maybeSingle();

      if (updateError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to backfill community member position title', updateError);
        }
      } else if (updated) {
        return updated;
      }
    }

    return data;
  }

  const affiliationType = defaults?.affiliation_type ?? 'community_member';
  const isCommunityMember = affiliationType === 'community_member';
  const affiliationStatus = defaults?.affiliation_status ?? (isCommunityMember ? 'approved' : 'pending');
  const affiliationRequestedAt =
    defaults?.affiliation_requested_at ?? (affiliationStatus === 'pending' ? new Date().toISOString() : null);
  const positionTitle = defaults?.position_title ?? (isCommunityMember ? PUBLIC_MEMBER_ROLE_LABEL : null);
  const homelessnessExperience = defaults?.homelessness_experience ?? 'none';
  const substanceUseExperience = defaults?.substance_use_experience ?? 'none';

  const insertPayload = {
    user_id: userId,
    display_name: defaults?.display_name ?? 'Community Member',
    role: defaults?.role ?? 'user',
    organization_id: defaults?.organization_id ?? null,
    rules_acknowledged_at: defaults?.rules_acknowledged_at ?? null,
    position_title: positionTitle,
    affiliation_type: affiliationType,
    affiliation_status: affiliationStatus,
    affiliation_requested_at: affiliationRequestedAt,
    affiliation_reviewed_at: defaults?.affiliation_reviewed_at ?? null,
    affiliation_reviewed_by: defaults?.affiliation_reviewed_by ?? null,
    bio: defaults?.bio ?? null,
    avatar_url: defaults?.avatar_url ?? null,
    homelessness_experience: homelessnessExperience,
    substance_use_experience: substanceUseExperience,
  } satisfies Partial<PortalProfile> & { user_id: string };

  const { data: inserted, error: insertError } = await portal
    .from('profiles')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

export async function getUserEmailForProfile(
  supabase: SupabaseClient<Database>,
  profileId: string,
) {
  const { data, error } = await supabase.rpc('portal_get_user_email', {
    p_profile_id: profileId,
  });

  if (error) {
    throw error;
  }

  return data ?? null;
}
