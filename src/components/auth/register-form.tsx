'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export function RegisterForm({ organizations, action }: RegisterFormProps) {
  const [state, formAction] = useFormState(action, { error: undefined });
  const [selectedOrg, setSelectedOrg] = useState('');

  return (
    <form action={formAction} className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" required maxLength={80} autoComplete="nickname" placeholder="Name neighbours will see" />
        <p className="text-xs text-slate-500">Use first names or community roles. No identifying neighbour information.</p>
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
