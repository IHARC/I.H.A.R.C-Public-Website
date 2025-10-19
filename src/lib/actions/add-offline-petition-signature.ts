'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { scanContentForSafety } from '@/lib/safety';
import { normalizeNamePart } from '@/lib/names';
import { normalizeEmail } from '@/lib/email';
import { normalizePhoneNumber } from '@/lib/phone';
import { PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';
import type { Database } from '@/types/supabase';
import { invalidatePetitionCaches } from '@/lib/cache/invalidate';

export type OfflinePetitionSignatureState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

type OfflineSignatureOptions = {
  actorProfileId: string;
  revalidatePaths?: string[];
};

type DisplayPreference = Database['portal']['Enums']['petition_display_preference'];

const DISPLAY_PREFERENCES: DisplayPreference[] = ['full_name', 'first_name_last_initial', 'anonymous'];

function validateEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

function safeTrim(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export async function addOfflinePetitionSignature(
  formData: FormData,
  { actorProfileId, revalidatePaths = [] }: OfflineSignatureOptions,
): Promise<OfflinePetitionSignatureState> {
  const supabase = await createSupabaseServerClient();
  const portal = supabase.schema('portal');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: 'error', message: 'Sign in again to continue.' };
  }

  if (!actorProfileId) {
    return { status: 'error', message: 'Moderator context is required.' };
  }

  const { data: actorProfile, error: actorError } = await portal
    .from('profiles')
    .select('id, user_id, role')
    .eq('id', actorProfileId)
    .maybeSingle();

  if (actorError || !actorProfile) {
    console.error('Failed to load moderator profile for offline petition signature', actorError);
    return { status: 'error', message: 'We could not verify your moderator permissions.' };
  }

  if (actorProfile.user_id !== user.id) {
    return { status: 'error', message: 'Your session no longer matches this moderator account.' };
  }

  if (actorProfile.role !== 'admin') {
    return { status: 'error', message: 'Only administrators can record offline signatures.' };
  }

  const petitionId = safeTrim(formData.get('petition_id'));
  if (!petitionId) {
    return { status: 'error', message: 'Select a petition to continue.' };
  }

  const { data: petition, error: petitionError } = await portal
    .from('petitions')
    .select('id, slug, title, is_active')
    .eq('id', petitionId)
    .maybeSingle();

  if (petitionError || !petition) {
    console.error('Failed to resolve petition for offline signature', petitionError);
    return { status: 'error', message: 'We could not find the selected petition.' };
  }

  const firstName = normalizeNamePart(formData.get('first_name'));
  const lastName = normalizeNamePart(formData.get('last_name'));

  if (!firstName) {
    return { status: 'error', message: 'Enter the signer\'s first name.' };
  }

  if (!lastName) {
    return { status: 'error', message: 'Enter the signer\'s last name.' };
  }

  const postalCodeRaw = safeTrim(formData.get('postal_code'));
  if (!postalCodeRaw) {
    return { status: 'error', message: 'Enter the signer\'s postal code.' };
  }

  const postalCode = postalCodeRaw.toUpperCase();
  if (postalCode.length < 3 || postalCode.length > 10) {
    return { status: 'error', message: 'Postal code should be between 3 and 10 characters.' };
  }

  const displayPreferenceRaw = safeTrim(formData.get('display_preference'));
  if (!DISPLAY_PREFERENCES.includes(displayPreferenceRaw as DisplayPreference)) {
    return { status: 'error', message: 'Select how the signer would like their name displayed publicly.' };
  }
  const displayPreference = displayPreferenceRaw as DisplayPreference;

  const emailInput = normalizeEmail(formData.get('email'));
  const phoneInput = normalizePhoneNumber(formData.get('phone'));

  if (emailInput && !validateEmail(emailInput)) {
    return { status: 'error', message: 'Enter a valid email address or leave the field blank.' };
  }

  const statementRaw = safeTrim(formData.get('statement')) || null;
  if (statementRaw && statementRaw.length > 500) {
    return { status: 'error', message: 'Notes should be 500 characters or fewer.' };
  }

  if (statementRaw) {
    const safety = scanContentForSafety(statementRaw);
    if (safety.hasPii) {
      return { status: 'error', message: 'Remove personal contact details from the note before saving.' };
    }
    if (safety.hasProfanity) {
      return { status: 'error', message: 'Please remove flagged language before saving this note.' };
    }
  }

  const shareWithPartners = formData.get('share_with_partners') === 'on';

  const nowIso = new Date().toISOString();
  const displayName = `${firstName} ${lastName}`.trim() || 'Community Member';

  const { data: insertedProfile, error: profileInsertError } = await portal
    .from('profiles')
    .insert({
      user_id: null,
      display_name: displayName,
      organization_id: null,
      role: 'user',
      bio: null,
      avatar_url: null,
      rules_acknowledged_at: nowIso,
      position_title: PUBLIC_MEMBER_ROLE_LABEL,
      affiliation_type: 'community_member',
      affiliation_status: 'approved',
      affiliation_requested_at: nowIso,
      affiliation_reviewed_at: nowIso,
      affiliation_reviewed_by: actorProfileId,
      homelessness_experience: 'none',
      substance_use_experience: 'none',
      has_signed_petition: true,
      petition_signed_at: nowIso,
    })
    .select('id')
    .single();

  if (profileInsertError || !insertedProfile) {
    console.error('Failed to create offline petition signer profile', profileInsertError);
    return { status: 'error', message: 'We could not create the signer profile. Try again.' };
  }

  const profileId = insertedProfile.id;

  const cleanupProfile = async () => {
    await portal.from('profile_contacts').delete().eq('profile_id', profileId);
    await portal.from('profiles').delete().eq('id', profileId);
  };

  try {
    let emailContactId: string | null = null;
    let phoneContactId: string | null = null;

    if (emailInput) {
      const { data: emailContact, error: emailError } = await portal
        .from('profile_contacts')
        .insert({
          profile_id: profileId,
          user_id: null,
          contact_type: 'email',
          contact_value: emailInput,
          normalized_value: emailInput,
        })
        .select('id')
        .single();

      if (emailError) {
        console.error('Failed to record email contact for offline petition signer', emailError);
        throw new Error('email_contact_failed');
      }

      emailContactId = emailContact?.id ?? null;
    }

    if (phoneInput) {
      const { data: phoneContact, error: phoneError } = await portal
        .from('profile_contacts')
        .insert({
          profile_id: profileId,
          user_id: null,
          contact_type: 'phone',
          contact_value: phoneInput,
          normalized_value: phoneInput,
        })
        .select('id')
        .single();

      if (phoneError) {
        console.error('Failed to record phone contact for offline petition signer', phoneError);
        throw new Error('phone_contact_failed');
      }

      phoneContactId = phoneContact?.id ?? null;
    }

    const { error: signatureError } = await portal.from('petition_signatures').insert({
      petition_id: petition.id,
      profile_id: profileId,
      user_id: null,
      statement: statementRaw,
      share_with_partners: shareWithPartners,
      first_name: firstName,
      last_name: lastName,
      email_contact_id: emailContactId,
      phone_contact_id: phoneContactId,
      postal_code: postalCode,
      display_preference: displayPreference,
    });

    if (signatureError) {
      if ('code' in signatureError && signatureError.code === '23505') {
        await cleanupProfile();
        return {
          status: 'error',
          message: 'A signature already exists for this signer. Refresh to confirm before trying again.',
        };
      }

      console.error('Failed to record offline petition signature', signatureError);
      throw new Error('signature_failed');
    }

    await logAuditEvent(supabase, {
      actorProfileId,
      action: 'petition_signed_offline',
      entityType: 'petition',
      entityId: petition.id,
      meta: {
        source: 'admin_portal',
        petition_slug: petition.slug,
        share_with_partners: shareWithPartners,
        display_preference: displayPreference,
        is_active: petition.is_active,
      },
    });

    const paths = new Set(revalidatePaths);
    paths.add('/command-center/admin');
    paths.add(`/portal/petition/${petition.slug}`);
    paths.add('/petition');
    paths.add('/petition/signers');
    paths.add('/portal/progress');

    await invalidatePetitionCaches(petition.slug, { paths: Array.from(paths) });

    return {
      status: 'success',
      message: `Added ${firstName} ${lastName} to "${petition.title}".`,
    };
  } catch (error) {
    await cleanupProfile();

    if (error instanceof Error) {
      if (error.message === 'email_contact_failed') {
        return { status: 'error', message: 'We could not save the email contact. Try again shortly.' };
      }
      if (error.message === 'phone_contact_failed') {
        return { status: 'error', message: 'We could not save the phone contact. Try again shortly.' };
      }
      if (error.message === 'signature_failed') {
        return { status: 'error', message: 'We could not record this signature. Try again shortly.' };
      }
    }

    console.error('Unexpected error while creating offline petition signature', error);
    return { status: 'error', message: 'We could not record this signature. Try again shortly.' };
  }
}
