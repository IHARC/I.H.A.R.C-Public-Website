'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Database } from '@/types/supabase';
import { NO_ORGANIZATION_VALUE, PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';
import { LIVED_EXPERIENCE_COPY, LIVED_EXPERIENCE_OPTIONS, type LivedExperienceStatus } from '@/lib/lived-experience';

export type ProfileDetailsFormState = {
  status: 'idle' | 'success';
  error?: string;
  message?: string;
};

type Organization = {
  id: string;
  name: string;
};

type AffiliationType = Database['portal']['Enums']['affiliation_type'];

type ProfileDetailsFormProps = {
  organizations: Organization[];
  initialState: ProfileDetailsFormState;
  action: (state: ProfileDetailsFormState, formData: FormData) => Promise<ProfileDetailsFormState>;
  initialValues: {
    displayName: string;
    organizationId: string | null;
    positionTitle: string | null;
    affiliationType: AffiliationType;
    homelessnessExperience: LivedExperienceStatus;
    substanceUseExperience: LivedExperienceStatus;
  };
};

export function ProfileDetailsForm({ organizations, action, initialState, initialValues }: ProfileDetailsFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [selectedOrg, setSelectedOrg] = useState(initialValues.organizationId ?? NO_ORGANIZATION_VALUE);
  const [affiliationType, setAffiliationType] = useState<AffiliationType>(initialValues.affiliationType);
  const [homelessnessExperience, setHomelessnessExperience] = useState<LivedExperienceStatus>(
    initialValues.homelessnessExperience,
  );
  const [substanceUseExperience, setSubstanceUseExperience] = useState<LivedExperienceStatus>(
    initialValues.substanceUseExperience,
  );

  const hideRoleField = affiliationType === 'community_member';

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-2xl border border-outline/20 bg-surface-container-high p-6 shadow-subtle"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-on-surface">Profile details</h2>
        <p className="text-sm text-on-surface/70">
          Update how neighbours see you on ideas, plans, and petition signatures.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          maxLength={80}
          autoComplete="nickname"
          defaultValue={initialValues.displayName}
        />
        <p className="text-xs text-muted">Use community-friendly names. Avoid sharing identifying neighbour details.</p>
      </div>

      <div className="grid gap-3">
        <Label>Affiliation</Label>
        <RadioGroup
          name="affiliation_type"
          value={affiliationType}
          onValueChange={(value) => setAffiliationType(value as AffiliationType)}
          className="grid gap-3 md:grid-cols-3"
        >
          <AffiliationOption
            id="affiliation-community"
            value="community_member"
            title="Community member"
            description="Collaborate as a neighbour with lived expertise."
          />
          <AffiliationOption
            id="affiliation-agency"
            value="agency_partner"
            title="Agency / organization"
            description="Request verified posting on behalf of a partner."
          />
          <AffiliationOption
            id="affiliation-government"
            value="government_partner"
            title="Government representative"
            description="Join as municipal, regional, or provincial leadership."
          />
        </RadioGroup>
        {affiliationType !== 'community_member' ? (
          <Alert className="border-primary/30 bg-primary/10 text-sm text-on-primary-container">
            <AlertTitle>Pending verification</AlertTitle>
            <AlertDescription>
              IHARC moderators confirm agency and government roles before enabling official responses. You can keep
              contributing as a community member while we verify.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted">
            We list community members as “Member of the public” to highlight neighbour-led collaboration.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="organization_id">Organization (optional)</Label>
        <Select name="organization_id" value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger id="organization_id">
            <SelectValue placeholder="Independent community member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ORGANIZATION_VALUE}>Independent community member</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hideRoleField ? (
        <input type="hidden" name="position_title" value={PUBLIC_MEMBER_ROLE_LABEL} />
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="position_title">Position or role</Label>
          <Input
            id="position_title"
            name="position_title"
            defaultValue={initialValues.positionTitle ?? ''}
            maxLength={120}
            placeholder="Public Health Nurse, Town Councillor, Outreach Supervisor, ..."
          />
          <p className="text-xs text-muted">Helps neighbours understand how you collaborate through the Command Center.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="homelessness_experience">Housing lived experience badge</Label>
          <Select
            name="homelessness_experience"
            value={homelessnessExperience}
            onValueChange={(value) => setHomelessnessExperience(value as LivedExperienceStatus)}
          >
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
          <ExperienceHelper selectedValue={homelessnessExperience} />
          <p className="text-xs text-muted">
            Share only what feels right. Badges honour neighbours with lived expertise navigating homelessness.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="substance_use_experience">Substance use lived experience badge</Label>
          <Select
            name="substance_use_experience"
            value={substanceUseExperience}
            onValueChange={(value) => setSubstanceUseExperience(value as LivedExperienceStatus)}
          >
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
          <ExperienceHelper selectedValue={substanceUseExperience} />
          <p className="text-xs text-muted">
            These badges acknowledge peers with lived experience around substance use and recovery.
          </p>
        </div>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>We could not save your profile</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === 'success' && state.message ? (
        <Alert className="border-success/40 bg-success/10 text-success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}

type AffiliationOptionProps = {
  id: string;
  value: AffiliationType;
  title: string;
  description: string;
};

function AffiliationOption({ id, value, title, description }: AffiliationOptionProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-surface-container p-3 text-sm font-medium text-on-surface shadow-subtle transition hover:border-primary/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
    >
      <RadioGroupItem id={id} value={value} className="mt-1" />
      <span>
        {title}
        <span className="mt-1 block text-xs font-normal text-muted">{description}</span>
      </span>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center md:w-auto">
      {pending ? 'Saving...' : 'Save profile'}
    </Button>
  );
}

function ExperienceHelper({ selectedValue }: { selectedValue: LivedExperienceStatus }) {
  const helperText = LIVED_EXPERIENCE_COPY[selectedValue]?.description;

  if (!helperText) {
    return null;
  }

  return <p className="text-xs text-muted">{helperText}</p>;
}
