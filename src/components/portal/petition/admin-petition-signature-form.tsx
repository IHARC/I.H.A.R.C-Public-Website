'use client';

import { useActionState, useEffect, useId, useMemo } from 'react';
import type { OfflinePetitionSignatureState } from '@/lib/actions/add-offline-petition-signature';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PetitionSummary = Pick<Database['portal']['Tables']['petitions']['Row'], 'id' | 'title' | 'slug' | 'is_active'>;

type AdminPetitionSignatureFormProps = {
  petitions: PetitionSummary[];
  action: (
    state: OfflinePetitionSignatureState,
    formData: FormData,
  ) => Promise<OfflinePetitionSignatureState>;
};

const INITIAL_STATE: OfflinePetitionSignatureState = { status: 'idle' };

export function AdminPetitionSignatureForm({ petitions, action }: AdminPetitionSignatureFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const { toast } = useToast();

  const petitionFieldId = useId();
  const statementFieldId = useId();
  const updatesFieldId = useId();
  const displayFieldsetId = useId();

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Signature recorded',
        description: state.message ?? 'Offline signature saved.',
      });
    } else if (state.status === 'error' && state.message) {
      toast({
        title: 'Unable to save signature',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  const availablePetitions = useMemo(() => {
    const active = petitions.filter((petition) => petition.is_active);
    return active.length ? active : petitions;
  }, [petitions]);

  if (!availablePetitions.length) {
    return (
      <p className="rounded-md border border-dashed border-outline/30 px-4 py-3 text-sm text-on-surface/70">
        No petitions are available. Publish a petition before recording offline signatures.
      </p>
    );
  }

  const defaultPetitionId = availablePetitions[0]?.id ?? '';

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            state.status === 'error'
              ? 'border-error/40 bg-error/10 text-error'
              : 'border-primary/40 bg-primary/10 text-on-primary'
          }`}
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={petitionFieldId}>Petition</Label>
        {availablePetitions.length === 1 ? (
          <>
            <p id={petitionFieldId} className="rounded-md border border-outline/20 bg-surface px-3 py-2 text-sm text-on-surface">
              {availablePetitions[0]?.title}
              {!availablePetitions[0]?.is_active ? ' (archived)' : ''}
            </p>
            <input type="hidden" name="petition_id" value={defaultPetitionId} />
          </>
        ) : (
          <Select name="petition_id" defaultValue={defaultPetitionId} required>
            <SelectTrigger id={petitionFieldId}>
              <SelectValue placeholder="Select petition" />
            </SelectTrigger>
            <SelectContent>
              {availablePetitions.map((petition) => (
                <SelectItem key={petition.id} value={petition.id}>
                  {petition.title}
                  {!petition.is_active ? ' (archived)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="manual_first_name">First name</Label>
          <Input id="manual_first_name" name="first_name" required autoComplete="given-name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="manual_last_name">Last name</Label>
          <Input id="manual_last_name" name="last_name" required autoComplete="family-name" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="manual_email">Email (optional)</Label>
          <Input id="manual_email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="manual_phone">Phone (optional)</Label>
          <Input id="manual_phone" name="phone" type="tel" inputMode="tel" placeholder="+16475551234" />
        </div>
      </div>

      <div className="grid gap-2 md:max-w-xs">
        <Label htmlFor="manual_postal_code">Postal code</Label>
        <Input id="manual_postal_code" name="postal_code" required autoComplete="postal-code" />
      </div>

      <fieldset aria-labelledby={displayFieldsetId} className="space-y-3 rounded-xl border border-outline/20 p-4">
        <legend id={displayFieldsetId} className="text-sm font-semibold text-on-surface">
          How should this name appear publicly?
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
            description='Shows as "Anonymous neighbour."'
          />
        </RadioGroup>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={statementFieldId} className="text-sm font-medium text-on-surface">
          Optional context for moderators (not public)
        </Label>
        <Textarea
          id={statementFieldId}
          name="statement"
          rows={4}
          maxLength={500}
          placeholder="Brief note from the signer (up to 500 characters)"
          className="resize-none text-sm"
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id={updatesFieldId} name="share_with_partners" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor={updatesFieldId} className="text-sm font-medium text-on-surface">
            Opt in to follow-up coordination
          </Label>
          <p className="text-xs text-on-surface/60">
            Select if the signer agreed to share their contact information for program updates or Council follow-up.
          </p>
        </div>
      </div>

      <p className="rounded-xl bg-surface-container px-4 py-3 text-xs text-on-surface/80">
        Record the signer's consent before submitting. Contact details remain private and only inform coordination
        between neighbours, agencies, and local government.
      </p>

      <Button type="submit">Save offline signature</Button>
    </form>
  );
}

type DisplayPreferenceOptionProps = {
  value: Database['portal']['Enums']['petition_display_preference'];
  label: string;
  description: string;
};

function DisplayPreferenceOption({ value, label, description }: DisplayPreferenceOptionProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-2 rounded-lg border border-outline/20 p-3">
      <RadioGroupItem id={id} value={value} />
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-on-surface">
          {label}
        </Label>
        <p className="text-xs text-on-surface/60">{description}</p>
      </div>
    </div>
  );
}
