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
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { AuthDivider } from '@/components/auth/auth-divider';
import { NO_ORGANIZATION_VALUE, PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';
import { LIVED_EXPERIENCE_COPY, LIVED_EXPERIENCE_OPTIONS, type LivedExperienceStatus } from '@/lib/lived-experience';

type FormState = {
  error?: string;
};

type Organization = {
  id: string;
  name: string;
};

type RegisterFormProps = {
  organizations: Organization[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  nextPath: string;
  initialError?: string | null;
};

type AffiliationType = Database['portal']['Enums']['affiliation_type'];
export function RegisterForm({ organizations, action, nextPath, initialError }: RegisterFormProps) {
  const [state, formAction] = useActionState(action, { error: initialError ?? undefined });
  const [selectedOrg, setSelectedOrg] = useState(NO_ORGANIZATION_VALUE);
  const [affiliationType, setAffiliationType] = useState<AffiliationType>('community_member');
  const [homelessnessExperience, setHomelessnessExperience] = useState<LivedExperienceStatus>('none');
  const [substanceUseExperience, setSubstanceUseExperience] = useState<LivedExperienceStatus>('none');

  const hideRoleField = affiliationType === 'community_member';

  return (
    <form action={formAction} className="mt-8 grid gap-6 rounded-2xl border border-outline/40 bg-surface p-8 shadow-subtle">
      <div className="space-y-3">
        <GoogleAuthButton intent="register" nextPath={nextPath} />
        <AuthDivider label="or continue by sharing details" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" required maxLength={80} autoComplete="nickname" placeholder="Name neighbours will see" />
        <p className="text-xs text-muted">Use first names or community roles. No identifying neighbour information.</p>
      </div>

      <div className="grid gap-3">
        <Label>How are you joining the Command Center?</Label>
        <RadioGroup name="affiliation_type" value={affiliationType} onValueChange={(value) => setAffiliationType(value as AffiliationType)} className="grid gap-3 md:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-surface-container p-3 text-sm font-medium text-on-surface shadow-subtle transition hover:border-primary/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary">
            <RadioGroupItem id="affiliation-community" value="community_member" className="mt-1" />
            <span>
              Community member
              <span className="mt-1 block text-xs font-normal text-muted">
                Share ideas, support plans, and collaborate as a neighbour.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-surface-container p-3 text-sm font-medium text-on-surface shadow-subtle transition hover:border-primary/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary">
            <RadioGroupItem id="affiliation-agency" value="agency_partner" className="mt-1" />
            <span>
              Agency / organization
              <span className="mt-1 block text-xs font-normal text-muted">
                Request verified posting on behalf of a partner organization.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-surface-container p-3 text-sm font-medium text-on-surface shadow-subtle transition hover:border-primary/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary">
            <RadioGroupItem id="affiliation-government" value="government_partner" className="mt-1" />
            <span>
              Government representative
              <span className="mt-1 block text-xs font-normal text-muted">
                Join as municipal, regional, or provincial staff or elected leadership.
              </span>
            </span>
          </label>
        </RadioGroup>
        {affiliationType !== 'community_member' ? (
          <Alert className="border-primary/30 bg-primary/10 text-sm text-on-primary-container">
            <AlertTitle>Pending verification</AlertTitle>
            <AlertDescription>
              An IHARC administrator will confirm your role before activating official posting privileges. You can still participate as a community member while we verify.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted">
            We’ll gently note your role as “Member of the public” so collaboration highlights neighbour-led insight.
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
        <p className="text-xs text-muted">Link an agency if you post on behalf of a partner organization.</p>
      </div>

      {hideRoleField ? (
        <input type="hidden" name="position_title" value={PUBLIC_MEMBER_ROLE_LABEL} />
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="position_title">Position or role</Label>
          <Input
            id="position_title"
            name="position_title"
            maxLength={120}
            placeholder="Public Health Nurse, Mayor, Outreach Coordinator, ..."
            required
          />
          <p className="text-xs text-muted">Helps neighbours understand how you collaborate in the Command Center.</p>
        </div>
      )}

      <div className="grid gap-4">
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
            Share only what feels right. Badges appear beside your contributions to honour lived expertise with homelessness.
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
            These badges help acknowledge peers and partners with lived experience around substance use and recovery.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.ca" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Minimum 8 characters" />
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>We could not finish registration</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center">
      {pending ? 'Creating account...' : 'Create account'}
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
