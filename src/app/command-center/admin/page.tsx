import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import type { PortalProfile } from '@/lib/profile';
import { logAuditEvent } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NO_ORGANIZATION_VALUE } from '@/lib/constants';
import type { Database } from '@/types/supabase';

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
  organization:
    | { id: string; name: string; verified: boolean }[]
    | { id: string; name: string; verified: boolean }
    | null;
};

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
    redirect('/command-center');
  }

  const isAdmin = profile.role === 'admin';

  const { data: recentMetrics } = await portal
    .from('metric_daily')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(12);

  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name, verified, website')
    .order('created_at', { ascending: false })
    .limit(100);

  const pendingAffiliations = isAdmin
    ? ((
        await portal
          .from('profiles')
          .select(
            `id, display_name, position_title, affiliation_type, affiliation_status, affiliation_requested_at, role, user_id,
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

    revalidatePath('/command-center');
    revalidatePath('/stats');
  }

  async function createOrganization(formData: FormData) {
    'use server';

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');
    const name = (formData.get('org_name') as string | null)?.trim();
    const website = (formData.get('org_website') as string | null)?.trim() || null;
    const verified = formData.get('org_verified') === 'on';
    const actorProfileId = formData.get('actor_profile_id') as string;

    if (!name) {
      throw new Error('Organization name is required');
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
    revalidatePath('/solutions/profile');
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

    if (!profileId) {
      throw new Error('Missing profile identifier.');
    }

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');

    const { data: profileRow, error: profileError } = await portalClient
      .from('profiles')
      .select('user_id, affiliation_type, affiliation_requested_at')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profileRow) {
      throw profileError ?? new Error('Profile not found.');
    }

    const reviewedAt = new Date().toISOString();
    const elevateRole = profileRow.affiliation_type !== 'community_member';
    const nextRole: PortalProfile['role'] = elevateRole ? 'org_rep' : 'user';

    const { error: updateError } = await portalClient
      .from('profiles')
      .update({
        role: nextRole,
        affiliation_status: 'approved',
        affiliation_reviewed_at: reviewedAt,
        affiliation_reviewed_by: actorProfileId,
      })
      .eq('id', profileId);

    if (updateError) {
      throw updateError;
    }

    await logAuditEvent(supa, {
      actorProfileId,
      action: 'profile_affiliation_approved',
      entityType: 'profile',
      entityId: profileId,
      meta: { nextRole, affiliationType: profileRow.affiliation_type },
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
      .select('user_id, affiliation_type, affiliation_requested_at')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profileRow) {
      throw profileError ?? new Error('Profile not found.');
    }

    const reviewedAt = new Date().toISOString();

    const { error: updateError } = await portalClient
      .from('profiles')
      .update({
        affiliation_status: 'revoked',
        affiliation_reviewed_at: reviewedAt,
        affiliation_reviewed_by: actorProfileId,
      })
      .eq('id', profileId);

    if (updateError) {
      throw updateError;
    }

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
          {organizations?.length ? (
            <div className="mt-4 space-y-2 text-sm text-muted">
              {organizations.map((org) => (
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
                      {(organizations ?? []).map((org) => (
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
            <div className="space-y-3">
              {pendingAffiliations.map((pending) => {
                const organizationName = Array.isArray(pending.organization)
                  ? pending.organization[0]?.name ?? null
                  : pending.organization?.name ?? null;
                return (
                  <div key={pending.id} className="flex flex-col gap-3 rounded border border-slate-100 p-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{pending.display_name}</p>
                      {pending.position_title ? (
                        <p className="text-sm text-muted">{pending.position_title}</p>
                      ) : null}
                      {organizationName ? (
                        <p className="text-xs text-muted">{organizationName}</p>
                      ) : null}
                      <p className="text-xs text-muted-subtle">
                        Requested {pending.affiliation_requested_at ? new Date(pending.affiliation_requested_at).toLocaleDateString('en-CA') : 'on registration'} ·{' '}
                        {pending.affiliation_type === 'agency_partner'
                          ? 'Agency partner'
                          : pending.affiliation_type === 'government_partner'
                            ? 'Government partner'
                            : 'Community member'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={approveAffiliation}>
                        <input type="hidden" name="actor_profile_id" value={profile.id} />
                        <input type="hidden" name="actor_user_id" value={user.id} />
                        <input type="hidden" name="profile_id" value={pending.id} />
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form action={declineAffiliation}>
                        <input type="hidden" name="actor_profile_id" value={profile.id} />
                        <input type="hidden" name="actor_user_id" value={user.id} />
                        <input type="hidden" name="profile_id" value={pending.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Decline
                        </Button>
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
