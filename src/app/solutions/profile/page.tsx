import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NO_ORGANIZATION_VALUE, PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';
import { LIVED_EXPERIENCE_COPY, normalizeLivedExperience, type LivedExperienceStatus } from '@/lib/lived-experience';

export const dynamic = 'force-dynamic';

export default async function PortalProfilePage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name, verified')
    .order('name', { ascending: true });
  const isCommunityMember = profile.affiliation_type === 'community_member';
  const homelessnessExperience: LivedExperienceStatus = profile.homelessness_experience ?? 'none';
  const substanceUseExperience: LivedExperienceStatus = profile.substance_use_experience ?? 'none';

  async function updateProfile(formData: FormData) {
    'use server';

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');
    const displayName = formData.get('display_name') as string;
    const rawOrganizationId = (formData.get('organization_id') as string | null)?.trim();
    const organizationId = rawOrganizationId && rawOrganizationId !== NO_ORGANIZATION_VALUE ? rawOrganizationId : null;
    const positionTitle = (formData.get('position_title') as string | null)?.trim() || null;
    const rawHomelessnessExperience = (formData.get('homelessness_experience') as string | null) ?? 'none';
    const rawSubstanceUseExperience = (formData.get('substance_use_experience') as string | null) ?? 'none';
    const homelessnessExperience = normalizeLivedExperience(rawHomelessnessExperience);
    const substanceUseExperience = normalizeLivedExperience(rawSubstanceUseExperience);
    const isCommunityMember = profile.affiliation_type === 'community_member';
    const finalPositionTitle = isCommunityMember ? positionTitle || PUBLIC_MEMBER_ROLE_LABEL : positionTitle;

    if (!displayName || displayName.length < 2) {
      throw new Error('Display name is required');
    }

    const { error } = await portalClient
      .from('profiles')
      .update({
        display_name: displayName,
        organization_id: organizationId,
        position_title: finalPositionTitle,
        homelessness_experience: homelessnessExperience,
        substance_use_experience: substanceUseExperience,
      })
      .eq('id', profile.id);

    if (error) {
      throw error;
    }

    revalidatePath('/solutions/profile');
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Portal profile</h1>
      {profile.affiliation_status === 'pending' ? (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          <AlertTitle>Verification in progress</AlertTitle>
          <AlertDescription>
            An IHARC administrator is verifying your agency or government role. You can keep collaborating as a community member in the meantime.
          </AlertDescription>
        </Alert>
      ) : null}
      {profile.affiliation_status === 'revoked' ? (
        <Alert className="mb-6 border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100">
          <AlertTitle>Verification declined</AlertTitle>
          <AlertDescription>
            Reach out to an IHARC administrator if details have changed or you need to update your affiliation.
          </AlertDescription>
        </Alert>
      ) : null}
      <form action={updateProfile} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" name="display_name" defaultValue={profile.display_name} required maxLength={80} />
          <p className="text-xs text-slate-500">Shown publicly unless you choose to post anonymously.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="position_title">Position or role</Label>
          <Input
            id="position_title"
            name="position_title"
            defaultValue={profile.position_title ?? (isCommunityMember ? PUBLIC_MEMBER_ROLE_LABEL : '')}
            placeholder="Public Health Nurse, Town Councillor, Outreach Supervisor, ..."
            maxLength={120}
          />
          <p className="text-xs text-slate-500">
            {isCommunityMember
              ? 'We list Community members as “Member of the public” by default. Update this if another description feels more accurate.'
              : 'Helps neighbours understand how you collaborate through the Command Center.'}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="organization_id">Organization affiliation</Label>
          <Select name="organization_id" defaultValue={profile.organization_id ?? NO_ORGANIZATION_VALUE}>
            <SelectTrigger id="organization_id">
              <SelectValue placeholder="Community member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ORGANIZATION_VALUE}>Independent community member</SelectItem>
              {(organizations ?? []).map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="homelessness_experience">Housing lived experience badge</Label>
            <Select name="homelessness_experience" defaultValue={homelessnessExperience}>
              <SelectTrigger id="homelessness_experience">
                <SelectValue placeholder="Select housing lived experience" />
              </SelectTrigger>
              <SelectContent>
                {LIVED_EXPERIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {LIVED_EXPERIENCE_COPY[homelessnessExperience]?.description}
            </p>
            <p className="text-xs text-slate-500">
              Share only what feels comfortable—badges spotlight peers with lived expertise on homelessness responses.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="substance_use_experience">Substance use lived experience badge</Label>
            <Select name="substance_use_experience" defaultValue={substanceUseExperience}>
              <SelectTrigger id="substance_use_experience">
                <SelectValue placeholder="Select substance use lived experience" />
              </SelectTrigger>
              <SelectContent>
                {LIVED_EXPERIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {LIVED_EXPERIENCE_COPY[substanceUseExperience]?.description}
            </p>
            <p className="text-xs text-slate-500">
              These badges elevate trusted insight from people with lived experience of substance use or recovery journeys.
            </p>
          </div>
        </div>
        <Button type="submit">Save profile</Button>
      </form>
    </div>
  );
}
