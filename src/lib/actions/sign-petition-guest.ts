'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeNamePart } from '@/lib/names';
import { normalizeEmail } from '@/lib/email';
import { scanContentForSafety } from '@/lib/safety';
import { invalidatePetitionCaches } from '@/lib/cache/invalidate';

export type GuestPetitionFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

type GuestPetitionOptions = {
  petitionId: string;
  petitionSlug: string;
  revalidatePaths?: string[];
};

const SUCCESS_MESSAGE =
  'Thank you — your signature is recorded. Check your email for a confirmation within the next few minutes.';

function safeTrim(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export async function signPetitionGuest(
  formData: FormData,
  { petitionId, petitionSlug, revalidatePaths = [] }: GuestPetitionOptions,
): Promise<GuestPetitionFormState> {
  const submittedPetitionId = safeTrim(formData.get('petition_id'));
  if (!submittedPetitionId || submittedPetitionId !== petitionId) {
    return { status: 'error', message: 'We could not match this petition. Refresh and try again.' };
  }

  const firstName = normalizeNamePart(formData.get('first_name'));
  const lastName = normalizeNamePart(formData.get('last_name'));
  const emailInput = normalizeEmail(formData.get('email'));
  const postalCodeInput = safeTrim(formData.get('postal_code'));
  const statementInput = safeTrim(formData.get('statement'));
  const shareWithPartners = safeTrim(formData.get('share_with_partners')) === 'on';

  if (!firstName) {
    return { status: 'error', message: 'Enter your first name to continue.' };
  }

  if (!lastName) {
    return { status: 'error', message: 'Enter your last name to continue.' };
  }

  if (!emailInput) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }

  if (!postalCodeInput) {
    return { status: 'error', message: 'Enter your postal code.' };
  }

  const postalCode = postalCodeInput.toUpperCase();
  if (postalCode.length < 3 || postalCode.length > 10) {
    return { status: 'error', message: 'Postal code should be between 3 and 10 characters.' };
  }

  const statement = statementInput || null;
  if (statement) {
    if (statement.length > 500) {
      return { status: 'error', message: 'Notes must be 500 characters or fewer.' };
    }
    const safety = scanContentForSafety(statement);
    if (safety.hasPii) {
      return { status: 'error', message: 'Remove personal contact details before submitting your note.' };
    }
    if (safety.hasProfanity) {
      return { status: 'error', message: 'Please remove flagged language before submitting.' };
    }
  }

  const supabase = await createSupabaseServerClient();
  const portal = supabase.schema('portal');

  const { data, error } = await portal.rpc('add_guest_petition_signature', {
    p_petition_id: petitionId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: emailInput,
    p_postal_code: postalCode,
    p_display_preference: 'full_name',
    p_statement: statement,
    p_share_with_partners: shareWithPartners,
  });

  if (error) {
    const message = typeof error.message === 'string' ? error.message : '';
    if (message.includes('first_name_required')) {
      return { status: 'error', message: 'Enter your first name to continue.' };
    }
    if (message.includes('last_name_required')) {
      return { status: 'error', message: 'Enter your last name to continue.' };
    }
    if (message.includes('email_required') || message.includes('email_invalid')) {
      return { status: 'error', message: 'Enter a valid email address.' };
    }
    if (message.includes('postal_code_required')) {
      return { status: 'error', message: 'Enter your postal code.' };
    }
    if (message.includes('postal_code_invalid')) {
      return { status: 'error', message: 'Postal code should be between 3 and 10 characters.' };
    }
    if (message.includes('statement_too_long')) {
      return { status: 'error', message: 'Notes must be 500 characters or fewer.' };
    }
    if (message.includes('signature_already_exists')) {
      return { status: 'error', message: 'You already signed this petition with this email address.' };
    }
    if (message.includes('petition_inactive')) {
      return { status: 'error', message: 'This petition is no longer collecting signatures.' };
    }
    if (message.includes('petition_id_required')) {
      return { status: 'error', message: 'We could not match this petition. Refresh and try again.' };
    }
    return { status: 'error', message: 'We could not record your signature. Try again shortly.' };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { status: 'error', message: 'We could not record your signature. Try again shortly.' };
  }

  const paths = new Set(revalidatePaths);
  paths.add(`/portal/petition/${petitionSlug}`);
  paths.add('/petition');
  paths.add('/emergency');
  paths.add('/petition/signers');
  paths.add('/portal/progress');

  await invalidatePetitionCaches(petitionSlug, { paths: Array.from(paths) });

  return { status: 'success', message: SUCCESS_MESSAGE };
}
