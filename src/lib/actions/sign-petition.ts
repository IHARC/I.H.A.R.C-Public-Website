'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { scanContentForSafety } from '@/lib/safety';
import { logAuditEvent } from '@/lib/audit';
import { normalizeNamePart } from '@/lib/names';
import { deriveSignerDefaults } from '@/lib/petition/signature';
import { normalizeEmail } from '@/lib/email';
import { normalizePhoneNumber } from '@/lib/phone';
import type { Database } from '@/types/supabase';

export type PetitionActionResult = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  alreadySigned?: boolean;
};

type SignPetitionOptions = {
  petitionId: string;
  revalidatePaths?: string[];
};

type DisplayPreference = Database['portal']['Enums']['petition_display_preference'];

const DISPLAY_PREFERENCES: DisplayPreference[] = ['full_name', 'first_name_last_initial', 'anonymous'];

function validateEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

export async function signPetition(
  formData: FormData,
  { petitionId, revalidatePaths = [] }: SignPetitionOptions,
): Promise<PetitionActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: 'error', message: 'Sign in to add your name.' };
  }

  const submittedPetitionId = formData.get('petition_id');
  if (typeof submittedPetitionId !== 'string' || submittedPetitionId !== petitionId) {
    return { status: 'error', message: 'We could not match this petition. Refresh and try again.' };
  }

  const firstNameFromForm = normalizeNamePart(formData.get('first_name'));
  const lastNameFromForm = normalizeNamePart(formData.get('last_name'));
  const emailFromForm = normalizeEmail(formData.get('email'));
  const phoneFromForm = normalizePhoneNumber(formData.get('phone'));
  const postalCodeRaw = (formData.get('postal_code') as string | null)?.trim();
  const displayPreferenceRaw = (formData.get('display_preference') as string | null) ?? '';
  const statementInput = (formData.get('statement') as string | null) ?? '';
  const optIn = formData.get('petition_updates') === 'on';

  if (!postalCodeRaw) {
    return { status: 'error', message: 'Enter your postal code.' };
  }

  const postalCode = postalCodeRaw.toUpperCase();
  if (postalCode.length < 3 || postalCode.length > 10) {
    return { status: 'error', message: 'Postal code should be between 3 and 10 characters.' };
  }

  if (!DISPLAY_PREFERENCES.includes(displayPreferenceRaw as DisplayPreference)) {
    return { status: 'error', message: 'Choose how you would like your name displayed.' };
  }

  const statement = statementInput.trim() || null;
  if (statement && statement.length > 500) {
    return { status: 'error', message: 'Notes must be 500 characters or fewer.' };
  }

  if (statement) {
    const safety = scanContentForSafety(statement);
    if (safety.hasPii) {
      return { status: 'error', message: 'Remove personal contact details before submitting your note.' };
    }
    if (safety.hasProfanity) {
      return { status: 'error', message: 'Please remove flagged language before submitting.' };
    }
  }

  try {
    const profile = await ensurePortalProfile(supabase, user.id);
    const {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      email: defaultEmail,
      phone: defaultPhone,
    } = deriveSignerDefaults(user, profile) ?? {};

    const firstName = firstNameFromForm ?? defaultFirstName;
    const lastName = lastNameFromForm ?? defaultLastName;
    const emailInput = emailFromForm ?? defaultEmail;
    const phoneInput = phoneFromForm ?? defaultPhone;

    const normalizedEmail = normalizeEmail(emailInput ?? undefined);
    const normalizedPhone = normalizePhoneNumber(phoneInput ?? undefined);

    if (!firstName) {
      return { status: 'error', message: 'Enter your first name to continue.' };
    }
    if (!lastName) {
      return { status: 'error', message: 'Enter your last name to continue.' };
    }
    if (!normalizedEmail && !normalizedPhone) {
      return { status: 'error', message: 'Share an email or phone number so we can confirm delivery with you.' };
    }
    if (normalizedEmail && !validateEmail(normalizedEmail)) {
      return { status: 'error', message: 'Enter a valid email address.' };
    }

    const portal = supabase.schema('portal');

    let emailContactId: string | null = null;
    let phoneContactId: string | null = null;

    if (normalizedEmail) {
      const { data: emailContact, error: emailContactError } = await portal
        .from('profile_contacts')
        .upsert(
          {
            profile_id: profile.id,
            user_id: user.id,
            contact_type: 'email',
            contact_value: normalizedEmail,
            normalized_value: normalizedEmail,
          },
          { onConflict: 'profile_id,contact_type,normalized_value' },
        )
        .select('id')
        .single();

      if (emailContactError) {
        console.error('Failed to upsert email contact for petition signature', emailContactError);
        return { status: 'error', message: 'We could not record your signature. Try again shortly.' };
      }

      emailContactId = emailContact?.id ?? null;
    }

    if (normalizedPhone) {
      const { data: phoneContact, error: phoneContactError } = await portal
        .from('profile_contacts')
        .upsert(
          {
            profile_id: profile.id,
            user_id: user.id,
            contact_type: 'phone',
            contact_value: normalizedPhone,
            normalized_value: normalizedPhone,
          },
          { onConflict: 'profile_id,contact_type,normalized_value' },
        )
        .select('id')
        .single();

      if (phoneContactError) {
        console.error('Failed to upsert phone contact for petition signature', phoneContactError);
        return { status: 'error', message: 'We could not record your signature. Try again shortly.' };
      }

      phoneContactId = phoneContact?.id ?? null;
    }

    if (!emailContactId && !phoneContactId) {
      return { status: 'error', message: 'Share an email or phone number so we can confirm delivery with you.' };
    }

    const { error: insertError } = await portal.from('petition_signatures').insert({
      petition_id: petitionId,
      profile_id: profile.id,
      user_id: user.id,
      statement,
      share_with_partners: optIn,
      first_name: firstName,
      last_name: lastName,
      email_contact_id: emailContactId,
      phone_contact_id: phoneContactId,
      postal_code: postalCode,
      display_preference: displayPreferenceRaw as DisplayPreference,
    });

    if (insertError) {
      if ('code' in insertError && insertError.code === '23505') {
        return {
          status: 'success',
          alreadySigned: true,
          message: 'You already signed this petition. Thank you for your support.',
        };
      }

      console.error('Failed to record petition signature', insertError);
      return { status: 'error', message: 'We could not record your signature. Try again shortly.' };
    }

    await portal
      .from('profiles')
      .update({ has_signed_petition: true, petition_signed_at: new Date().toISOString() })
      .eq('id', profile.id);

    await logAuditEvent(supabase, {
      actorProfileId: profile.id,
      action: 'petition_signed',
      entityType: 'petition',
      entityId: petitionId,
      meta: {
        share_with_partners: optIn,
        display_preference: displayPreferenceRaw,
        statement_length: statement?.length ?? 0,
      },
    });

    const pathsToRevalidate = Array.from(new Set(revalidatePaths));
    await Promise.all(pathsToRevalidate.map((path) => revalidatePath(path)));

    return { status: 'success', message: 'Thanks for supporting the declaration.' };
  } catch (error) {
    console.error('Error while recording petition signature', error);
    return { status: 'error', message: 'We could not record your signature. Try again shortly.' };
  }
}
