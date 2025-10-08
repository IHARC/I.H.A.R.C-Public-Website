import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import type { PortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import {
  addOfflinePetitionSignature,
  type OfflinePetitionSignatureState,
} from '@/lib/actions/add-offline-petition-signature';
import { AdminPetitionSignatureForm } from '@/components/portal/petition/admin-petition-signature-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NO_ORGANIZATION_VALUE, PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';
import type { Database } from '@/types/supabase';

const GOVERNMENT_ROLE_TYPES: Database['portal']['Enums']['government_role_type'][] = ['staff', 'politician'];
const GOVERNMENT_LEVELS: Database['portal']['Enums']['government_level'][] = ['municipal', 'county', 'provincial', 'federal', 'other'];

const METRIC_OPTIONS = [
  { key: 'outdoor_count', label: 'Neighbours Outdoors' },
  { key: 'shelter_occupancy', label: 'Shelter Occupancy (%)' },
  { key: 'overdoses_reported', label: 'Drug Poisoning Emergencies' },
  { key: 'narcan_distributed', label: 'Naloxone Kits Shared' },
  { key: 'encampment_count', label: 'Encampment Sites Documented' },
  { key: 'warming_beds_available', label: 'Warming Beds Available' },
] as const;

export const dynamic = 'force-dynamic';

type PendingAffiliationRow = {
  id: string;
  display_name: string;
  position_title: string | null;
  affiliation_type: Database['portal']['Enums']['affiliation_type'];
  affiliation_status: Database['portal']['Enums']['affiliation_status'];
  affiliation_requested_at: string | null;
  role: Database['portal']['Enums']['profile_role'];
  user_id: string | null;
  requested_organization_name: string | null;
  requested_government_name: string | null;
  requested_government_level: Database['portal']['Enums']['government_level'] | null;
  requested_government_role: Database['portal']['Enums']['government_role_type'] | null;
  government_role_type: Database['portal']['Enums']['government_role_type'] | null;
  organization:
    | { id: string; name: string; verified: boolean }[]
    | { id: string; name: string; verified: boolean }
    | null;
};

type ManageableProfileRow = {
  id: string;
  display_name: string;
  position_title: string | null;
  affiliation_type: Database['portal']['Enums']['affiliation_type'];
  affiliation_status: Database['portal']['Enums']['affiliation_status'];
  organization_id: string | null;
  government_role_type: Database['portal']['Enums']['government_role_type'] | null;
  user_id: string | null;
  organization:
    | { id: string; name: string; category: Database['portal']['Enums']['organization_category']; government_level: Database['portal']['Enums']['government_level'] | null }[]
    | { id: string; name: string; category: Database['portal']['Enums']['organization_category']; government_level: Database['portal']['Enums']['government_level'] | null }
    | null;
};

type PetitionOption = Pick<Database['portal']['Tables']['petitions']['Row'], 'id' | 'title' | 'slug' | 'is_active'>;

function formatGovernmentLevel(level: Database['portal']['Enums']['government_level'] | null): string {
  switch (level) {
    case 'municipal':
      return 'Municipal';
    case 'county':
      return 'County / regional';
    case 'provincial':
      return 'Provincial / territorial';
    case 'federal':
      return 'Federal';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
}

type ProfileInviteWithOrg = {
  id: string;
  email: string;
  display_name: string | null;
  position_title: string | null;
  affiliation_type: Database['portal']['Enums']['affiliation_type'];
  status: Database['portal']['Enums']['invite_status'];
  created_at: string;
  organization: { id: string; name: string }[] | { id: string; name: string } | null;
};

export default async function CommandCenterAdminPage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  if (!['moderator', 'admin'].includes(profile.role)) {
    redirect('/portal/ideas');
  }

  const isAdmin = profile.role === 'admin';

  const { data: recentMetrics } = await portal
    .from('metric_daily')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(12);

  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name, verified, website, category, government_level')
    .order('created_at', { ascending: false })
    .limit(100);

  const organizationsList = organizations ?? [];
  const communityOrganizations = organizationsList.filter((org) => org.category === 'community');
  const governmentOrganizations = organizationsList.filter((org) => org.category === 'government');

  const pendingAffiliations = isAdmin
    ? ((
        await portal
          .from('profiles')
          .select(
            `id, display_name, position_title, affiliation_type, affiliation_status, affiliation_requested_at, role, user_id,
             requested_organization_name, requested_government_name, requested_government_level, requested_government_role, government_role_type,
             organization:organization_id(id, name, verified)`,
          )
          .eq('affiliation_status', 'pending')
          .order('affiliation_requested_at', { ascending: true })
      ).data as PendingAffiliationRow[] | null) ?? null
    : null;

  const recentInvites = isAdmin
    ? ((
        await portal
          .from('profile_invites')
          .select(
            `id, email, display_name, position_title, affiliation_type, status, created_at,
             organization:organization_id(id, name),
             invited_by:invited_by_profile_id(display_name)`,
          )
          .order('created_at', { ascending: false })
          .limit(12)
      ).data as ProfileInviteWithOrg[] | null) ?? null
    : null;

  const manageableProfiles = isAdmin
    ? ((
        await portal
          .from('profiles')
          .select(
            `id, display_name, position_title, affiliation_type, affiliation_status, organization_id, user_id, government_role_type,
             organization:organization_id(id, name, category, government_level)`,
          )
          .neq('affiliation_status', 'pending')
          .order('display_name', { ascending: true })
          .limit(100)
      ).data as ManageableProfileRow[] | null) ?? null
    : null;

  const petitionOptions: PetitionOption[] = isAdmin
    ? ((
        await portal
          .from('petitions')
          .select('id, title, slug, is_active')
          .order('created_at', { ascending: false })
      ).data as PetitionOption[] | null) ?? []
    : [];

  async function uploadMetric(formData: FormData) {
    'use server';

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');
    const metric_date = formData.get('metric_date') as string;
    const metric_key = formData.get('metric_key') as string;
    const value = Number(formData.get('value'));
    const source = (formData.get('source') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    const actorProfileId = formData.get('actor_profile_id') as string;

    if (!metric_date || !metric_key || Number.isNaN(value)) {
      throw new Error('Missing required fields');
    }

    await portalClient.from('metric_daily').upsert({
      metric_date,
      metric_key,
      value,
      source,
      notes,
    });

    await logAuditEvent(supa, {
      actorProfileId,
      action: 'metric_upsert',
      entityType: 'metric_daily',
      entityId: `${metric_date}:${metric_key}`,
      meta: { value, source, notes },
    });

    revalidatePath('/portal/ideas');
    revalidatePath('/stats');
  }

  async function createOrganization(formData: FormData) {
    'use server';

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');
    const name = (formData.get('org_name') as string | null)?.trim();
    const website = (formData.get('org_website') as string | null)?.trim() || null;
    const verified = formData.get('org_verified') === 'on';
    const categoryInput = (formData.get('org_category') as string | null)?.trim() ?? 'community';
    const isGovernmentCategory = categoryInput === 'government';
    const governmentLevelInput = (formData.get('org_government_level') as string | null)?.trim() ?? null;
    const actorProfileId = formData.get('actor_profile_id') as string;

    if (!name) {
      throw new Error('Organization name is required');
    }

    if (!['community', 'government'].includes(categoryInput)) {
      throw new Error('Select a valid organization category.');
    }

    const governmentLevel = isGovernmentCategory && governmentLevelInput
      ? (GOVERNMENT_LEVELS.includes(governmentLevelInput as Database['portal']['Enums']['government_level'])
          ? (governmentLevelInput as Database['portal']['Enums']['government_level'])
          : null)
      : null;

    if (isGovernmentCategory && !governmentLevel) {
      throw new Error('Select the government level for this organization.');
    }

    const {
      data: { user },
      error: userError,
    } = await supa.auth.getUser();

    if (userError || !user) {
      throw userError ?? new Error('Unable to resolve moderator session');
    }

    const actorUserId = user.id;

    const { data: inserted, error } = await portalClient
      .from('organizations')
      .insert({
        name,
        website,
        verified,
        category: categoryInput as Database['portal']['Enums']['organization_category'],
        government_level: governmentLevel,
        created_by: actorUserId,
        updated_by: actorUserId,
      })
      .select('id, name, verified, website')
      .single();

    if (error) {
      throw error;
    }

    await logAuditEvent(supa, {
      actorProfileId,
      action: 'organization_created',
      entityType: 'organization',
      entityId: inserted.id,
      meta: { verified, website },
    });

    revalidatePath('/command-center/admin');
    revalidatePath('/portal/profile');
    revalidatePath('/register');
  }

  async function invitePartner(formData: FormData) {
    'use server';

    const email = (formData.get('invite_email') as string | null)?.trim().toLowerCase();
    const displayNameInput = (formData.get('invite_display_name') as string | null)?.trim() || null;
    const positionTitle = (formData.get('invite_position_title') as string | null)?.trim() || null;
    const rawOrganizationId = (formData.get('invite_organization_id') as string | null)?.trim();
    const organizationId = rawOrganizationId && rawOrganizationId !== NO_ORGANIZATION_VALUE ? rawOrganizationId : null;
    const rawAffiliation = (formData.get('invite_affiliation_type') as string | null)?.trim() || 'agency_partner';
    const message = (formData.get('invite_message') as string | null)?.trim() || null;
    const actorProfileId = formData.get('actor_profile_id') as string;

    const allowedAffiliations: PortalProfile['affiliation_type'][] = ['community_member', 'agency_partner', 'government_partner'];
    const affiliationType = allowedAffiliations.includes(rawAffiliation as PortalProfile['affiliation_type'])
      ? (rawAffiliation as PortalProfile['affiliation_type'])
      : 'agency_partner';

    if (!email || !email.includes('@')) {
      throw new Error('Invite requires a valid email address.');
    }

    const supa = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supa.auth.getUser();

    if (userError || !user) {
      throw userError ?? new Error('Moderator session required');
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supa.auth.getSession();

    if (sessionError || !sessionData.session?.access_token) {
      throw sessionError ?? new Error('Moderator session required');
    }

    const response = await supa.functions.invoke('portal-admin-invite', {
      body: {
        email,
        displayName: displayNameInput,
        positionTitle,
        affiliationType,
        organizationId,
        message,
        actorProfileId,
      },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send invitation');
    }

    revalidatePath('/command-center/admin');
  }

  async function approveAffiliation(formData: FormData) {
    'use server';

    const profileId = formData.get('profile_id') as string;
    const actorProfileId = formData.get('actor_profile_id') as string;
    const approvedOrganizationIdRaw = (formData.get('approved_organization_id') as string | null)?.trim() ?? null;
    const approvedGovernmentRoleRaw = (formData.get('approved_government_role') as string | null)?.trim() ?? null;
    if (!profileId) {
      throw new Error('Missing profile identifier.');
    }

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');

    const { data: profileRow, error: profileError } = await portalClient
      .from('profiles')
      .select('user_id, affiliation_type, affiliation_requested_at, organization_id')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profileRow) {
      throw profileError ?? new Error('Profile not found.');
    }

    const reviewedAt = new Date().toISOString();
    const elevateRole = profileRow.affiliation_type !== 'community_member';

    let organizationIdToAssign: string | null = null;
    let governmentRoleToAssign: Database['portal']['Enums']['government_role_type'] | null = null;

    if (profileRow.affiliation_type === 'agency_partner') {
      if (!approvedOrganizationIdRaw) {
        throw new Error('Select an organization before approving.');
      }
      organizationIdToAssign = approvedOrganizationIdRaw;
    } else if (profileRow.affiliation_type === 'government_partner') {
      if (!approvedOrganizationIdRaw) {
        throw new Error('Select a government team before approving.');
      }
      if (!approvedGovernmentRoleRaw) {
        throw new Error('Select a government role type.');
      }
      const parsedGovernmentRole = approvedGovernmentRoleRaw as Database['portal']['Enums']['government_role_type'];
      if (!GOVERNMENT_ROLE_TYPES.includes(parsedGovernmentRole)) {
        throw new Error('Select a government role type.');
      }
      organizationIdToAssign = approvedOrganizationIdRaw;
      governmentRoleToAssign = parsedGovernmentRole;
    } else {
      organizationIdToAssign = null;
      governmentRoleToAssign = null;
    }

    const profileUpdate: Partial<PortalProfile> = {
      organization_id: organizationIdToAssign,
      affiliation_status: 'approved',
      affiliation_reviewed_at: reviewedAt,
      affiliation_reviewed_by: actorProfileId,
      requested_organization_name: null,
      requested_government_name: null,
      requested_government_level: null,
      requested_government_role: null,
      government_role_type: governmentRoleToAssign,
    };

    const { error: updateError } = await portalClient
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profileId);

    if (updateError) {
      throw updateError;
    }

    if (elevateRole) {
      const { data: roleRow, error: roleError } = await portalClient
        .from('roles')
        .select('id')
        .eq('name', 'org_rep')
        .maybeSingle();

      if (roleError || !roleRow) {
        throw roleError ?? new Error('Org representative role not configured.');
      }

      const { data: existingRole, error: existingRoleError } = await portalClient
        .from('profile_roles')
        .select('id, revoked_at')
        .eq('profile_id', profileId)
        .eq('role_id', roleRow.id)
        .maybeSingle();

      if (existingRoleError) {
        throw existingRoleError;
      }

      if (!existingRole) {
        const { error: insertRoleError } = await portalClient.from('profile_roles').insert({
          profile_id: profileId,
          role_id: roleRow.id,
          granted_by_profile_id: actorProfileId,
          granted_at: reviewedAt,
        });

        if (insertRoleError) {
          throw insertRoleError;
        }
      } else if (existingRole.revoked_at) {
        const { error: reinstateError } = await portalClient
          .from('profile_roles')
          .update({
            revoked_at: null,
            revoked_by_profile_id: null,
            reason: null,
            updated_at: reviewedAt,
            granted_by_profile_id: actorProfileId,
            granted_at: reviewedAt,
          })
          .eq('id', existingRole.id);

        if (reinstateError) {
          throw reinstateError;
        }
      }
    } else {
      const { data: orgRole } = await portalClient
        .from('roles')
        .select('id')
        .eq('name', 'org_rep')
        .maybeSingle();

      if (orgRole) {
        await portalClient
          .from('profile_roles')
          .update({
            revoked_at: reviewedAt,
            revoked_by_profile_id: actorProfileId,
            updated_at: reviewedAt,
          })
          .eq('profile_id', profileId)
          .eq('role_id', orgRole.id)
          .is('revoked_at', null);
      }
    }

    await supa.rpc('portal_refresh_profile_claims', {
      p_profile_id: profileId,
    });

    await logAuditEvent(supa, {
      actorProfileId,
      action: 'profile_affiliation_approved',
      entityType: 'profile',
      entityId: profileId,
      meta: { affiliationType: profileRow.affiliation_type, elevated: elevateRole },
    });

    if (profileRow.user_id) {
      await ensurePortalProfile(supa, profileRow.user_id);
    }

    revalidatePath('/command-center/admin');
  }

  async function declineAffiliation(formData: FormData) {
    'use server';

    const profileId = formData.get('profile_id') as string;
    const actorProfileId = formData.get('actor_profile_id') as string;
    if (!profileId) {
      throw new Error('Missing profile identifier.');
    }

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');

    const { data: profileRow, error: profileError } = await portalClient
      .from('profiles')
      .select('user_id, affiliation_type, affiliation_requested_at, organization_id')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profileRow) {
      throw profileError ?? new Error('Profile not found.');
    }

    const reviewedAt = new Date().toISOString();

    const declineUpdate: Partial<PortalProfile> = {
      affiliation_status: 'revoked',
      affiliation_reviewed_at: reviewedAt,
      affiliation_reviewed_by: actorProfileId,
      requested_organization_name: null,
      requested_government_name: null,
      requested_government_level: null,
      requested_government_role: null,
    };

    if (profileRow.affiliation_type !== 'community_member') {
      declineUpdate.organization_id = null;
      declineUpdate.government_role_type = null;
    }

    const { error: updateError } = await portalClient
      .from('profiles')
      .update(declineUpdate)
      .eq('id', profileId);

    if (updateError) {
      throw updateError;
    }

    const { data: roleRow } = await portalClient
      .from('roles')
      .select('id')
      .eq('name', 'org_rep')
      .maybeSingle();

    if (roleRow) {
      await portalClient
        .from('profile_roles')
        .update({
          revoked_at: reviewedAt,
          revoked_by_profile_id: actorProfileId,
          updated_at: reviewedAt,
          reason: 'affiliation_declined',
        })
        .eq('profile_id', profileId)
        .eq('role_id', roleRow.id)
        .is('revoked_at', null);
    }

    await supa.rpc('portal_refresh_profile_claims', {
      p_profile_id: profileId,
    });

    await logAuditEvent(supa, {
      actorProfileId,
      action: 'profile_affiliation_declined',
      entityType: 'profile',
      entityId: profileId,
      meta: { affiliationType: profileRow.affiliation_type },
    });

    if (profileRow.user_id) {
      await ensurePortalProfile(supa, profileRow.user_id);
    }

    revalidatePath('/command-center/admin');
  }

  async function updateMemberAffiliation(formData: FormData) {
    'use server';

    const profileId = (formData.get('profile_id') as string | null)?.trim();
    if (!profileId) {
      throw new Error('Select a member profile to update.');
    }

    const rawAffiliationType = (formData.get('affiliation_type') as string | null)?.trim() ?? '';
    const rawAffiliationStatus = (formData.get('affiliation_status') as string | null)?.trim() ?? '';
    const rawOrganizationId = (formData.get('organization_id') as string | null)?.trim() ?? '';
    const rawGovernmentRoleType = (formData.get('government_role_type') as string | null)?.trim() ?? '';
    const positionTitleInput = (formData.get('position_title') as string | null)?.trim() ?? '';

    const supa = await createSupabaseServerClient();
    const {
      data: { user: actorUser },
      error: actorError,
    } = await supa.auth.getUser();

    if (actorError || !actorUser) {
      throw actorError ?? new Error('Moderator session required');
    }

    const actorProfile = await ensurePortalProfile(supa, actorUser.id);
    if (actorProfile.role !== 'admin') {
      throw new Error('Administrator access required to update member affiliations.');
    }

    const portalClient = supa.schema('portal');

    const { data: profileRow, error: profileError } = await portalClient
      .from('profiles')
      .select(
        'user_id, affiliation_type, affiliation_status, affiliation_requested_at, affiliation_reviewed_at, affiliation_reviewed_by, organization_id, government_role_type',
      )
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profileRow) {
      throw profileError ?? new Error('Profile not found.');
    }

    const allowedAffiliations: PortalProfile['affiliation_type'][] = [
      'community_member',
      'agency_partner',
      'government_partner',
    ];
    const allowedStatuses: PortalProfile['affiliation_status'][] = ['approved', 'pending', 'revoked'];

    const affiliationType = allowedAffiliations.includes(rawAffiliationType as PortalProfile['affiliation_type'])
      ? (rawAffiliationType as PortalProfile['affiliation_type'])
      : profileRow.affiliation_type;
    let affiliationStatus = allowedStatuses.includes(rawAffiliationStatus as PortalProfile['affiliation_status'])
      ? (rawAffiliationStatus as PortalProfile['affiliation_status'])
      : profileRow.affiliation_status;

    const organizationIdInput =
      rawOrganizationId && rawOrganizationId !== NO_ORGANIZATION_VALUE ? rawOrganizationId : null;
    let organizationId = organizationIdInput;

    let governmentRoleType: Database['portal']['Enums']['government_role_type'] | null = null;
    const nowIso = new Date().toISOString();
    let affiliationRequestedAt = profileRow.affiliation_requested_at;
    let affiliationReviewedAt = profileRow.affiliation_reviewed_at;
    let affiliationReviewedBy = profileRow.affiliation_reviewed_by;
    let positionTitle: string | null = positionTitleInput || null;

    if (affiliationType === 'community_member') {
      organizationId = null;
      affiliationStatus = 'approved';
      governmentRoleType = null;
      affiliationRequestedAt = null;
      affiliationReviewedAt = null;
      affiliationReviewedBy = null;
      positionTitle = PUBLIC_MEMBER_ROLE_LABEL;
    } else {
      if (!positionTitle || positionTitle.length < 2) {
        throw new Error("Enter the member's position or role (minimum 2 characters).");
      }

      if (affiliationType === 'agency_partner') {
        if (!organizationId) {
          throw new Error('Select an organization for this agency representative.');
        }

        const { data: organization, error: organizationError } = await portalClient
          .from('organizations')
          .select('category')
          .eq('id', organizationId)
          .maybeSingle();

        if (organizationError || !organization) {
          throw organizationError ?? new Error('Organization not found.');
        }

        if (organization.category !== 'community') {
          throw new Error('Agency representatives must link to a community organization.');
        }
      } else if (affiliationType === 'government_partner') {
        if (!organizationId) {
          throw new Error('Select a government team for this member.');
        }

        const { data: organization, error: organizationError } = await portalClient
          .from('organizations')
          .select('category')
          .eq('id', organizationId)
          .maybeSingle();

        if (organizationError || !organization) {
          throw organizationError ?? new Error('Government listing not found.');
        }

        if (organization.category !== 'government') {
          throw new Error('Government representatives must link to a government listing.');
        }

        const parsedRole = GOVERNMENT_ROLE_TYPES.includes(
          rawGovernmentRoleType as Database['portal']['Enums']['government_role_type'],
        )
          ? (rawGovernmentRoleType as Database['portal']['Enums']['government_role_type'])
          : null;

        if (!parsedRole) {
          throw new Error('Select whether this member is staff or elected leadership.');
        }

        governmentRoleType = parsedRole;
      }
    }

    if (affiliationStatus === 'approved') {
      affiliationReviewedAt = nowIso;
      affiliationReviewedBy = actorProfile.id;
      if (!affiliationRequestedAt) {
        affiliationRequestedAt = nowIso;
      }
    } else if (affiliationStatus === 'pending') {
      affiliationRequestedAt = nowIso;
      affiliationReviewedAt = null;
      affiliationReviewedBy = null;
    } else if (affiliationStatus === 'revoked') {
      affiliationReviewedAt = nowIso;
      affiliationReviewedBy = actorProfile.id;
    }

    if (affiliationType !== 'government_partner') {
      governmentRoleType = null;
    }

    const updatePayload: Partial<PortalProfile> = {
      affiliation_type: affiliationType,
      affiliation_status: affiliationStatus,
      affiliation_requested_at: affiliationRequestedAt,
      affiliation_reviewed_at: affiliationReviewedAt,
      affiliation_reviewed_by: affiliationReviewedBy,
      organization_id: organizationId,
      government_role_type: governmentRoleType,
      position_title: positionTitle,
      requested_organization_name: null,
      requested_government_name: null,
      requested_government_level: null,
      requested_government_role: null,
    };

    const { error: updateError } = await portalClient.from('profiles').update(updatePayload).eq('id', profileId);

    if (updateError) {
      throw updateError;
    }

    const { data: roleRow } = await portalClient.from('roles').select('id').eq('name', 'org_rep').maybeSingle();

    if (roleRow) {
      if (affiliationType !== 'community_member' && affiliationStatus === 'approved') {
        const { data: existingRole, error: existingRoleError } = await portalClient
          .from('profile_roles')
          .select('id, revoked_at')
          .eq('profile_id', profileId)
          .eq('role_id', roleRow.id)
          .maybeSingle();

        if (existingRoleError) {
          throw existingRoleError;
        }

        if (!existingRole) {
          const { error: insertRoleError } = await portalClient.from('profile_roles').insert({
            profile_id: profileId,
            role_id: roleRow.id,
            granted_by_profile_id: actorProfile.id,
            granted_at: nowIso,
          });

          if (insertRoleError) {
            throw insertRoleError;
          }
        } else if (existingRole.revoked_at) {
          const { error: reinstateError } = await portalClient
            .from('profile_roles')
            .update({
              revoked_at: null,
              revoked_by_profile_id: null,
              updated_at: nowIso,
              granted_by_profile_id: actorProfile.id,
              granted_at: nowIso,
            })
            .eq('id', existingRole.id);

          if (reinstateError) {
            throw reinstateError;
          }
        }
      } else {
        await portalClient
          .from('profile_roles')
          .update({
            revoked_at: nowIso,
            revoked_by_profile_id: actorProfile.id,
            updated_at: nowIso,
          })
          .eq('profile_id', profileId)
          .eq('role_id', roleRow.id)
          .is('revoked_at', null);
      }
    }

    await supa.rpc('portal_refresh_profile_claims', {
      p_profile_id: profileId,
    });

    await logAuditEvent(supa, {
      actorProfileId: actorProfile.id,
      action: 'profile_affiliation_updated',
      entityType: 'profile',
      entityId: profileId,
      meta: { affiliationType, affiliationStatus },
    });

    if (profileRow.user_id) {
      await ensurePortalProfile(supa, profileRow.user_id);
    }

    revalidatePath('/command-center/admin');
    revalidatePath('/portal/profile');
    revalidatePath('/portal/ideas');
    revalidatePath('/portal/plans');
  }

  async function handleOfflineSignature(
    prevState: OfflinePetitionSignatureState,
    formData: FormData,
  ): Promise<OfflinePetitionSignatureState> {
    'use server';

    return addOfflinePetitionSignature(formData, {
      actorProfileId: profile.id,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload daily metric</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadMetric} className="grid gap-4">
            <input type="hidden" name="actor_profile_id" value={profile.id} />
            <input type="hidden" name="actor_user_id" value={user.id} />
            <div className="grid gap-2">
              <Label htmlFor="metric_date">Metric date</Label>
              <Input id="metric_date" name="metric_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metric_key">Metric key</Label>
              <Select name="metric_key" defaultValue="outdoor_count" required>
                <SelectTrigger id="metric_key">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" step="0.1" required min="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="Agency / dataset" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Context for this measurement" />
            </div>
            <Button type="submit" className="justify-self-start">
              Save metric
            </Button>
          </form>
        </CardContent>
      </Card>
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Record offline petition signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminPetitionSignatureForm petitions={petitionOptions} action={handleOfflineSignature} />
            <p className="text-xs text-on-surface/70">
              Use this form when neighbours sign up in person. Each entry creates a portal profile without login access
              and updates petition metrics immediately.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Register partner organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createOrganization} className="grid gap-4">
            <input type="hidden" name="actor_profile_id" value={profile.id} />
            <input type="hidden" name="actor_user_id" value={user.id} />
            <div className="grid gap-2">
              <Label htmlFor="org_name">Organization name</Label>
              <Input id="org_name" name="org_name" required maxLength={120} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org_website">Website</Label>
              <Input id="org_website" name="org_website" type="url" placeholder="https://" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org_category">Category</Label>
              <select
                id="org_category"
                name="org_category"
                defaultValue="community"
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="community">Community / agency partner</option>
                <option value="government">Government team</option>
              </select>
              <p className="text-xs text-muted">Government teams require a level selection below.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org_government_level">Government level</Label>
              <select
                id="org_government_level"
                name="org_government_level"
                defaultValue=""
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="">Select level (required for government)</option>
                <option value="municipal">Municipal</option>
                <option value="county">County / regional</option>
                <option value="provincial">Provincial / territorial</option>
                <option value="federal">Federal</option>
                <option value="other">Other / multi-jurisdictional</option>
              </select>
              <p className="text-xs text-muted">Leave blank for community organizations.</p>
            </div>
            <div className="flex items-center gap-2">
              <input id="org_verified" name="org_verified" type="checkbox" className="h-4 w-4 accent-brand" />
              <Label htmlFor="org_verified" className="text-sm">
                Mark as verified agency representative
              </Label>
            </div>
            <Button type="submit" className="justify-self-start">
              Add organization
            </Button>
          </form>
          {organizationsList.length ? (
            <div className="mt-4 space-y-2 text-sm text-muted">
              {organizationsList.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded border border-slate-100 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">{org.name}</p>
                    {org.website && (
                      <a
                        className="text-xs text-brand hover:underline"
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {org.website}
                      </a>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {org.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Invite agency or government partner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={invitePartner} className="grid gap-4">
                <input type="hidden" name="actor_profile_id" value={profile.id} />
                <input type="hidden" name="actor_user_id" value={user.id} />
                <div className="grid gap-2">
                  <Label htmlFor="invite_email">Email</Label>
                  <Input id="invite_email" name="invite_email" type="email" required placeholder="partner@example.ca" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite_display_name">Suggested display name</Label>
                  <Input id="invite_display_name" name="invite_display_name" placeholder="Agency contact name" maxLength={120} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite_position_title">Position or role</Label>
                  <Input
                    id="invite_position_title"
                    name="invite_position_title"
                    placeholder="Public Health Nurse, Mayor, Outreach Supervisor, ..."
                    maxLength={120}
                  />
                  <p className="text-xs text-muted">Used across the portal to highlight the invitee&rsquo;s role in community care.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite_organization_id">Organization</Label>
                  <Select name="invite_organization_id" defaultValue={NO_ORGANIZATION_VALUE}>
                    <SelectTrigger id="invite_organization_id">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ORGANIZATION_VALUE}>No linked organization yet</SelectItem>
                      {organizationsList.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite_affiliation_type">Affiliation type</Label>
                  <Select name="invite_affiliation_type" defaultValue="agency_partner" required>
                    <SelectTrigger id="invite_affiliation_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agency_partner">Agency / organization representative</SelectItem>
                      <SelectItem value="government_partner">Government representative</SelectItem>
                      <SelectItem value="community_member">Community collaborator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite_message">Message (optional)</Label>
                  <Textarea
                    id="invite_message"
                    name="invite_message"
                    rows={3}
                    placeholder="Context for why you&rsquo;re inviting this partner or supports they can offer"
                  />
                </div>
                <Button type="submit" className="justify-self-start">
                  Send invitation
                </Button>
              </form>
              {recentInvites?.length ? (
                <div className="space-y-2 text-sm text-muted">
                  {recentInvites.map((invite) => {
                    const organizationName = Array.isArray(invite.organization)
                      ? invite.organization[0]?.name ?? null
                      : invite.organization?.name ?? null;
                    return (
                      <div
                        key={invite.id}
                        className="flex flex-col gap-1 rounded border border-slate-100 p-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {invite.display_name ?? invite.email}
                          </p>
                          <p className="text-xs text-muted">{invite.email}</p>
                          {invite.position_title ? (
                            <p className="text-xs text-muted">{invite.position_title}</p>
                          ) : null}
                          {organizationName ? (
                            <p className="text-xs text-muted">{organizationName}</p>
                          ) : null}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-muted">
                          {invite.status === 'pending'
                            ? 'Pending'
                            : invite.status === 'accepted'
                              ? 'Accepted'
                              : invite.status === 'cancelled'
                                ? 'Cancelled'
                                : 'Expired'}
                          <span className="ml-2 lowercase text-muted-subtle">
                            {new Date(invite.created_at).toLocaleDateString('en-CA')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending affiliation approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAffiliations?.length ? (
                <div className="space-y-4">
                  {pendingAffiliations.map((pending) => {
                    const organizationRelation = Array.isArray(pending.organization)
                      ? pending.organization[0] ?? null
                      : pending.organization ?? null;
                    const organizationId = organizationRelation?.id ?? null;
                    const organizationName = organizationRelation?.name ?? null;
                    const requestedOrgName = pending.requested_organization_name;
                    const requestedGovName = pending.requested_government_name;
                    const requestedGovLevel = pending.requested_government_level;
                    const defaultGovRole = pending.requested_government_role ?? pending.government_role_type ?? 'staff';
                    return (
                      <div key={pending.id} className="space-y-3 rounded border border-slate-100 p-3 dark:border-slate-800">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{pending.display_name}</p>
                          {pending.position_title ? (
                            <p className="text-sm text-muted">{pending.position_title}</p>
                          ) : null}
                          {organizationName ? (
                            <p className="text-xs text-muted">Current: {organizationName}</p>
                          ) : null}
                          {pending.affiliation_requested_at ? (
                            <p className="text-xs text-muted-subtle">
                              Requested {new Date(pending.affiliation_requested_at).toLocaleDateString('en-CA')} ·{' '}
                              {pending.affiliation_type === 'agency_partner'
                                ? 'Agency partner'
                                : pending.affiliation_type === 'government_partner'
                                  ? 'Government partner'
                                  : 'Community member'}
                            </p>
                          ) : null}
                          {pending.affiliation_type === 'agency_partner' && requestedOrgName ? (
                            <p className="text-xs text-muted">Pending org: {requestedOrgName}</p>
                          ) : null}
                          {pending.affiliation_type === 'government_partner' && requestedGovName ? (
                            <p className="text-xs text-muted">
                              Pending government: {requestedGovName}
                              {requestedGovLevel ? ` · ${formatGovernmentLevel(requestedGovLevel)}` : ''}
                            </p>
                          ) : null}
                          {pending.affiliation_type === 'government_partner' && pending.requested_government_role ? (
                            <p className="text-xs text-muted">Requested role: {pending.requested_government_role === 'politician' ? 'Elected leadership' : 'Public servant / staff'}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                          <form action={approveAffiliation} className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                            <input type="hidden" name="actor_profile_id" value={profile.id} />
                            <input type="hidden" name="actor_user_id" value={user.id} />
                            <input type="hidden" name="profile_id" value={pending.id} />
                            {pending.affiliation_type === 'agency_partner' ? (
                              <div className="flex flex-col">
                                <Label htmlFor={`approved-org-${pending.id}`} className="text-xs font-medium text-muted">
                                  Assign organization
                                </Label>
                                <select
                                  id={`approved-org-${pending.id}`}
                                  name="approved_organization_id"
                                  defaultValue={organizationId ?? ''}
                                  required
                                  className="min-w-[200px] rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                  <option value="">Select organization</option>
                                  {communityOrganizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                      {org.name}
                                    </option>
                                  ))}
                                </select>
                                {requestedOrgName ? (
                                  <span className="mt-1 text-xs text-muted">Neighbour requested: {requestedOrgName}</span>
                                ) : null}
                              </div>
                            ) : null}
                            {pending.affiliation_type === 'government_partner' ? (
                              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                                <div className="flex flex-col">
                                  <Label htmlFor={`approved-gov-${pending.id}`} className="text-xs font-medium text-muted">
                                    Assign government team
                                  </Label>
                                  <select
                                    id={`approved-gov-${pending.id}`}
                                    name="approved_organization_id"
                                    defaultValue={organizationId ?? ''}
                                    required
                                    className="min-w-[220px] rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  >
                                    <option value="">Select government team</option>
                                    {governmentOrganizations.map((org) => (
                                      <option key={org.id} value={org.id}>
                                        {org.name} • {formatGovernmentLevel(org.government_level)}
                                      </option>
                                    ))}
                                  </select>
                                  {requestedGovName ? (
                                    <span className="mt-1 text-xs text-muted">
                                      Requested: {requestedGovName}
                                      {requestedGovLevel ? ` · ${formatGovernmentLevel(requestedGovLevel)}` : ''}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex flex-col">
                                  <Label htmlFor={`approved-role-${pending.id}`} className="text-xs font-medium text-muted">
                                    Role type
                                  </Label>
                                  <select
                                    id={`approved-role-${pending.id}`}
                                    name="approved_government_role"
                                    defaultValue={defaultGovRole}
                                    required
                                    className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  >
                                    <option value="staff">Public servant / staff</option>
                                    <option value="politician">Elected leadership</option>
                                  </select>
                                </div>
                              </div>
                            ) : null}
                            <Button type="submit" size="sm">Approve</Button>
                          </form>
                          <form action={declineAffiliation} className="flex flex-row items-end gap-2">
                            <input type="hidden" name="actor_profile_id" value={profile.id} />
                            <input type="hidden" name="actor_user_id" value={user.id} />
                            <input type="hidden" name="profile_id" value={pending.id} />
                            <Button type="submit" size="sm" variant="outline">Decline</Button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">No pending affiliation approvals.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
      {isAdmin && manageableProfiles?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Manage member affiliations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              Update a member&rsquo;s affiliation type, status, and linked organization. Changes refresh permissions
              immediately.
            </p>
            {manageableProfiles.map((member) => {
              const organizationRelation = Array.isArray(member.organization)
                ? member.organization[0] ?? null
                : member.organization ?? null;
              const organizationName = organizationRelation?.name ?? null;
              const organizationCategory = organizationRelation?.category ?? null;
              const organizationLevel = organizationRelation?.government_level ?? null;

              return (
                <form
                  key={member.id}
                  action={updateMemberAffiliation}
                  className="grid gap-3 rounded border border-slate-100 p-3 shadow-subtle dark:border-slate-800"
                >
                  <input type="hidden" name="profile_id" value={member.id} />
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{member.display_name}</p>
                      {member.position_title ? (
                        <p className="text-xs text-muted">{member.position_title}</p>
                      ) : (
                        <p className="text-xs text-muted">No public role listed</p>
                      )}
                      {organizationName ? (
                        <p className="text-xs text-muted">
                          Linked to {organizationName}
                          {organizationCategory === 'government' && organizationLevel
                            ? ` · ${formatGovernmentLevel(organizationLevel)}`
                            : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-muted">No linked organization</p>
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {member.affiliation_status === 'approved'
                        ? 'Approved'
                        : member.affiliation_status === 'pending'
                          ? 'Pending'
                          : 'Revoked'}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1">
                      <Label htmlFor={`manage-affiliation-${member.id}`} className="text-xs font-medium text-muted">
                        Affiliation type
                      </Label>
                      <select
                        id={`manage-affiliation-${member.id}`}
                        name="affiliation_type"
                        defaultValue={member.affiliation_type}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="community_member">Community member</option>
                        <option value="agency_partner">Agency / organization</option>
                        <option value="government_partner">Government representative</option>
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`manage-status-${member.id}`} className="text-xs font-medium text-muted">
                        Affiliation status
                      </Label>
                      <select
                        id={`manage-status-${member.id}`}
                        name="affiliation_status"
                        defaultValue={member.affiliation_status}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="revoked">Revoked</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`manage-organization-${member.id}`} className="text-xs font-medium text-muted">
                      Linked organization
                    </Label>
                    <select
                      id={`manage-organization-${member.id}`}
                      name="organization_id"
                      defaultValue={member.organization_id ?? ''}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="">No linked organization</option>
                      {communityOrganizations.length ? (
                        <optgroup label="Community partners">
                          {communityOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {governmentOrganizations.length ? (
                        <optgroup label="Government teams">
                          {governmentOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name} · {formatGovernmentLevel(org.government_level)}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                    <p className="text-xs text-muted">
                      Community members ignore this field. Government partners must link to a government listing.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1">
                      <Label htmlFor={`manage-gov-role-${member.id}`} className="text-xs font-medium text-muted">
                        Government role classification
                      </Label>
                      <select
                        id={`manage-gov-role-${member.id}`}
                        name="government_role_type"
                        defaultValue={member.government_role_type ?? ''}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">Select classification</option>
                        <option value="staff">Public servant / staff</option>
                        <option value="politician">Elected leadership</option>
                      </select>
                      <p className="text-xs text-muted">
                        Required when approving government representatives. Leave blank for community or agency members.
                      </p>
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`manage-position-${member.id}`} className="text-xs font-medium text-muted">
                        Position or role
                      </Label>
                      <Input
                        id={`manage-position-${member.id}`}
                        name="position_title"
                        defaultValue={member.position_title ?? ''}
                        maxLength={120}
                        placeholder="Coordinator, Councillor, Outreach Nurse, ..."
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="justify-self-start">
                    Save changes
                  </Button>
                </form>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
      {recentMetrics?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {recentMetrics.map((item) => (
                <div key={`${item.metric_date}-${item.metric_key}`} className="flex items-center justify-between rounded border border-slate-100 p-2 dark:border-slate-800">
                  <div>
                    <p className="font-medium">{METRIC_OPTIONS.find((option) => option.key === item.metric_key)?.label ?? item.metric_key}</p>
                    <p className="text-xs text-muted">{item.metric_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.value}</p>
                    {item.source && <p className="text-xs text-muted">{item.source}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
