'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Database } from '@/types/supabase';

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
};

type AffiliationType = Database['portal']['Enums']['affiliation_type'];

export function RegisterForm({ organizations, action }: RegisterFormProps) {
  const [state, formAction] = useFormState(action, { error: undefined });
  const [selectedOrg, setSelectedOrg] = useState('');
  const [affiliationType, setAffiliationType] = useState<AffiliationType>('community_member');

  return (
    <form action={formAction} className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" required maxLength={80} autoComplete="nickname" placeholder="Name neighbours will see" />
        <p className="text-xs text-slate-500">Use first names or community roles. No identifying neighbour information.</p>
      </div>

      <div className="grid gap-3">
        <Label>How are you joining the Command Center?</Label>
        <RadioGroup name="affiliation_type" value={affiliationType} onValueChange={(value) => setAffiliationType(value as AffiliationType)} className="grid gap-3 md:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <RadioGroupItem id="affiliation-community" value="community_member" className="mt-1" />
            <span>
              Community member
              <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                Share ideas, support plans, and collaborate as a neighbour.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <RadioGroupItem id="affiliation-agency" value="agency_partner" className="mt-1" />
            <span>
              Agency / organization
              <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                Request verified posting on behalf of a partner organization.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <RadioGroupItem id="affiliation-government" value="government_partner" className="mt-1" />
            <span>
              Government representative
              <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                Join as municipal, regional, or provincial staff or elected leadership.
              </span>
            </span>
          </label>
        </RadioGroup>
        {affiliationType !== 'community_member' ? (
          <Alert className="bg-amber-50 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
            <AlertTitle>Pending verification</AlertTitle>
            <AlertDescription>
              An IHARC administrator will confirm your role before activating official posting privileges. You can still participate as a community member while we verify.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="organization_id">Organization (optional)</Label>
        <Select name="organization_id" value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger id="organization_id">
            <SelectValue placeholder="Independent community member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Independent community member</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">Link an agency if you post on behalf of a partner organization.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="position_title">Position or role</Label>
        <Input
          id="position_title"
          name="position_title"
          maxLength={120}
          placeholder="Public Health Nurse, Mayor, Outreach Coordinator, ..."
          required={affiliationType !== 'community_member'}
        />
        <p className="text-xs text-slate-500">Helps neighbours understand how you collaborate in the Command Center.</p>
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
