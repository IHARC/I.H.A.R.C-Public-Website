'use client';

import { useActionState, useEffect, useId } from 'react';
import type { GuestPetitionFormState } from '@/lib/actions/sign-petition-guest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/lib/analytics';
import { useFormStatus } from 'react-dom';

type PetitionGuestSignFormProps = {
  action: (state: GuestPetitionFormState, formData: FormData) => Promise<GuestPetitionFormState>;
  petitionId: string;
};

const INITIAL_STATE: GuestPetitionFormState = { status: 'idle' };

export function PetitionGuestSignForm({ action, petitionId }: PetitionGuestSignFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const { toast } = useToast();

  const formHeadingId = useId();

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Signature received',
        description: state.message ?? 'Thank you for adding your name.',
      });
      trackEvent('petition_signed_guest');
    } else if (state.status === 'error' && state.message) {
      toast({
        title: 'We could not add your name',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} aria-labelledby={formHeadingId} className="space-y-5">
      <input type="hidden" name="petition_id" value={petitionId} />

      <div className="space-y-2">
        <h3 id={formHeadingId} className="text-lg font-semibold text-on-surface">
          Share your support without creating an account
        </h3>
        <p className="text-sm text-on-surface/70">
          We send a confirmation to the email you provide. In an emergency call 911.
        </p>
      </div>

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
      </div>

      <TextField
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />

      <TextField
        name="postal_code"
        label="Postal code"
        autoComplete="postal-code"
        className="md:max-w-xs"
        required
      />

      <p className="rounded-xl bg-surface px-4 py-3 text-xs text-on-surface/70">
        Your name is stored privately and only visible to moderators. We do not publish your email or sell your data.
        Signatures remind County partners that neighbours expect overdose response and housing supports. The Good
        Samaritan Drug Overdose Act protects anyone calling for medical help during an overdose.
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
  placeholder?: string;
  required?: boolean;
};

function TextField({ name, label, type = 'text', className, autoComplete, placeholder, required }: TextFieldProps) {
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
        placeholder={placeholder}
        required={required}
        className="mt-2"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? 'Signing…' : 'Sign without an account'}
    </Button>
  );
}
