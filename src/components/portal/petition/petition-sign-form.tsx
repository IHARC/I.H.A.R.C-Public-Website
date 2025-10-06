'use client';

import { useEffect, useId } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/lib/analytics';

export type PetitionFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  alreadySigned?: boolean;
};

const INITIAL_STATE: PetitionFormState = { status: 'idle' };

type PetitionSignFormProps = {
  action: (state: PetitionFormState, formData: FormData) => Promise<PetitionFormState>;
  petitionId: string;
};

export function PetitionSignForm({ action, petitionId }: PetitionSignFormProps) {
  const [state, formAction] = useFormState(action, INITIAL_STATE);
  const { toast } = useToast();

  const statementId = useId();
  const updatesId = useId();
  const displayFieldsetId = useId();

  useEffect(() => {
    if (state.status === 'success' && !state.alreadySigned) {
      toast({
        title: 'Thank you',
        description: 'Your support is recorded. You can now comment on plans and propose ideas.',
      });
      trackEvent('petition_signed');
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="petition_id" value={petitionId} />

      {state.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.status === 'error'
              ? 'border-error/40 bg-error/10 text-error'
              : 'border-primary/25 bg-primary/10 text-on-primary'
          }`}
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="first_name" label="First name" autoComplete="given-name" required />
        <TextField name="last_name" label="Last name" autoComplete="family-name" required />
        <TextField
          type="email"
          name="email"
          label="Email"
          autoComplete="email"
          className="md:col-span-2"
          required
        />
        <TextField
          name="postal_code"
          label="Postal code"
          autoComplete="postal-code"
          className="md:col-span-2"
          required
        />
      </div>

      <fieldset aria-labelledby={displayFieldsetId} className="space-y-3 rounded-xl border border-outline/20 p-4">
        <legend id={displayFieldsetId} className="text-sm font-semibold text-on-surface">
          How should we list your name publicly?
        </legend>
        <RadioGroup name="display_preference" defaultValue="full_name" className="grid gap-2 md:grid-cols-3">
          <DisplayPreferenceOption value="full_name" label="Full name" description="Shows first and last name." />
          <DisplayPreferenceOption
            value="first_name_last_initial"
            label="First name + last initial"
            description="Example: Alex H."
          />
          <DisplayPreferenceOption
            value="anonymous"
            label="Anonymous"
            description="Shows as “Anonymous neighbour.”"
          />
        </RadioGroup>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={statementId} className="text-sm font-medium text-on-surface">
          Optional comment to Council
        </Label>
        <Textarea
          id={statementId}
          name="statement"
          maxLength={500}
          rows={4}
          placeholder="Share context (not public, up to 500 characters)"
          className="resize-none text-sm"
        />
        <p className="text-xs text-on-surface/60">
          Notes help moderators and Council understand community priorities. They are stored privately alongside your
          signature.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id={updatesId} name="petition_updates" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor={updatesId} className="text-sm font-medium text-on-surface">
            Email me petition updates and Council outcomes
          </Label>
          <p className="text-xs text-on-surface/60">
            Moderators will only reach out about declaration milestones or collaboration sessions you opt into.
          </p>
        </div>
      </div>

      <p className="rounded-xl bg-surface-container px-4 py-3 text-xs text-on-surface/80">
        By clicking Sign, you confirm this is your name and support for declaring a municipal State of Emergency. Your
        display preference controls how your name appears on the public list. We will not sell your data.
      </p>

      <SubmitButton />
    </form>
  );
}

type TextFieldProps = {
  name: string;
  label: string;
  type?: string;
  className?: string;
  autoComplete?: string;
  required?: boolean;
};

function TextField({ name, label, type = 'text', className, autoComplete, required }: TextFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-medium text-on-surface">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-2"
      />
    </div>
  );
}

type DisplayPreferenceOptionProps = {
  value: string;
  label: string;
  description: string;
};

function DisplayPreferenceOption({ value, label, description }: DisplayPreferenceOptionProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-outline/20 bg-surface p-3">
      <RadioGroupItem id={id} value={value} className="mt-1" />
      <Label htmlFor={id} className="space-y-1 leading-none">
        <span className="block text-sm font-semibold text-on-surface">{label}</span>
        <span className="block text-xs text-on-surface/70">{description}</span>
      </Label>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? 'Submitting…' : 'Sign the petition'}
    </Button>
  );
}
