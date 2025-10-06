import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile, type PortalProfile } from '@/lib/profile';
import { ProfileDetailsForm, type ProfileDetailsFormState } from '@/components/portal/profile/profile-details-form';
import {
  ProfileContactCard,
  type EmailFormState,
  type PhoneFormState,
} from '@/components/portal/profile/profile-contact-card';
import { ProfilePasswordForm, type PasswordFormState } from '@/components/portal/profile/profile-password-form';
import { normalizeLivedExperience } from '@/lib/lived-experience';
import { normalizePhoneNumber, maskPhoneNumber } from '@/lib/phone';
import { normalizeEmail } from '@/lib/email';
import { NO_ORGANIZATION_VALUE, PUBLIC_MEMBER_ROLE_LABEL } from '@/lib/constants';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type Organization = {
  id: string;
  name: string;
};

type AffiliationType = Database['portal']['Enums']['affiliation_type'];

const ALLOWED_AFFILIATIONS: AffiliationType[] = ['community_member', 'agency_partner', 'government_partner'];

const INITIAL_PROFILE_STATE: ProfileDetailsFormState = { status: 'idle' };
const INITIAL_EMAIL_STATE: EmailFormState = { status: 'idle' };
const INITIAL_PHONE_STATE: PhoneFormState = { status: 'idle' };
const INITIAL_PASSWORD_STATE: PasswordFormState = { status: 'idle' };

type UpdateProfileResult = ProfileDetailsFormState;
type UpdateEmailResult = EmailFormState;
type UpdatePhoneResult = PhoneFormState;
type UpdatePasswordResult = PasswordFormState;

export default async function PortalProfilePage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/portal/profile');
  }

  const profile = await ensurePortalProfile(supabase, user.id);

  const { data: organizationsData } = await portal
    .from('organizations')
    .select('id, name')
    .order('name', { ascending: true });

  const organizations: Organization[] = organizationsData ?? [];

  const initialValues = {
    displayName: profile.display_name ?? 'Community member',
    organizationId: profile.organization_id,
    positionTitle: profile.position_title,
    affiliationType: profile.affiliation_type,
    homelessnessExperience: profile.homelessness_experience ?? 'none',
    substanceUseExperience: profile.substance_use_experience ?? 'none',
  };

  const initialEmail = user.email ?? null;
  const initialPhone = user.phone ?? null;

  async function updateProfileDetails(_prevState: ProfileDetailsFormState, formData: FormData): Promise<UpdateProfileResult> {
    'use server';

    const supa = await createSupabaseServerClient();
    const portalClient = supa.schema('portal');

    const displayName = (formData.get('display_name') as string | null)?.trim();
    const rawOrganizationId = (formData.get('organization_id') as string | null)?.trim();
    const organizationId = rawOrganizationId && rawOrganizationId !== NO_ORGANIZATION_VALUE ? rawOrganizationId : null;
    const rawAffiliation = (formData.get('affiliation_type') as string | null)?.trim() ?? 'community_member';
    const affiliationType = ALLOWED_AFFILIATIONS.includes(rawAffiliation as AffiliationType)
      ? (rawAffiliation as AffiliationType)
      : 'community_member';
    const positionTitleInput = (formData.get('position_title') as string | null)?.trim() ?? null;
    const rawHomelessnessExperience = (formData.get('homelessness_experience') as string | null) ?? 'none';
    const rawSubstanceUseExperience = (formData.get('substance_use_experience') as string | null) ?? 'none';
    const homelessnessExperience = normalizeLivedExperience(rawHomelessnessExperience);
    const substanceUseExperience = normalizeLivedExperience(rawSubstanceUseExperience);

    if (!displayName || displayName.length < 2) {
      return { status: 'idle', error: 'Share the name neighbours should see.' };
    }

    const isCommunityMember = affiliationType === 'community_member';
    const finalPositionTitle = isCommunityMember ? PUBLIC_MEMBER_ROLE_LABEL : positionTitleInput;

    let affiliationStatus: PortalProfile['affiliation_status'] = profile.affiliation_status;
    let affiliationRequestedAt = profile.affiliation_requested_at;
    let affiliationReviewedAt = profile.affiliation_reviewed_at;
    let affiliationReviewedBy = profile.affiliation_reviewed_by;

    if (affiliationType === 'community_member') {
      affiliationStatus = 'approved';
      affiliationRequestedAt = null;
      affiliationReviewedAt = null;
      affiliationReviewedBy = null;
    } else if (profile.affiliation_type !== affiliationType) {
      affiliationStatus = 'pending';
      affiliationRequestedAt = new Date().toISOString();
      affiliationReviewedAt = null;
      affiliationReviewedBy = null;
    }

    try {
      const updatePayload: Partial<PortalProfile> = {
        display_name: displayName,
        organization_id: organizationId,
        position_title: finalPositionTitle,
        affiliation_type: affiliationType,
        affiliation_status: affiliationStatus,
        affiliation_requested_at: affiliationRequestedAt,
        affiliation_reviewed_at: affiliationReviewedAt,
        affiliation_reviewed_by: affiliationReviewedBy,
        homelessness_experience: homelessnessExperience,
        substance_use_experience: substanceUseExperience,
      };

      const { error } = await portalClient.from('profiles').update(updatePayload).eq('id', profile.id);

      if (error) {
        throw error;
      }

      revalidatePath('/portal/profile');
      return { status: 'success', message: 'Profile updated.' };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 'idle', error: error.message };
      }
      return { status: 'idle', error: 'We could not update your profile right now.' };
    }
  }

  async function updateEmail(_prevState: EmailFormState, formData: FormData): Promise<UpdateEmailResult> {
    'use server';

    const supa = await createSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supa.auth.getUser();

    if (!currentUser) {
      return { status: 'idle', error: 'Sign in to update your contact details.' };
    }

    const emailInput = normalizeEmail(formData.get('email'));

    if (!emailInput) {
      if (!currentUser.email) {
        return { status: 'idle', message: 'Email remains empty. Add one when you are ready.' };
      }
      return { status: 'idle', error: 'Enter a valid email address to update your account.' };
    }

    if (currentUser.email && currentUser.email.toLowerCase() === emailInput) {
      return { status: 'idle', message: 'This email is already active on your account.' };
    }

    try {
      const { error } = await supa.auth.updateUser({ email: emailInput });
      if (error) {
        throw error;
      }

      return {
        status: 'success',
        message: 'Check your inbox to confirm the update. We will switch emails once you verify.',
      };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 'idle', error: error.message };
      }
      return { status: 'idle', error: 'We could not update your email right now.' };
    }
  }

  async function updatePhone(prevState: PhoneFormState, formData: FormData): Promise<UpdatePhoneResult> {
    'use server';

    const supa = await createSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supa.auth.getUser();

    if (!currentUser) {
      return { status: 'idle', error: 'Sign in to update your contact details.' };
    }

    const intent = (formData.get('intent') as string | null) ?? '';
    const stage = (formData.get('stage') as string | null) ?? 'request';

    if (intent === 'cancel') {
      return { status: 'idle' };
    }

    if (stage === 'verify') {
      const otpCode = (formData.get('otp_code') as string | null)?.trim();
      const rawPhone = (formData.get('otp_phone') as string | null) ?? (formData.get('phone') as string | null) ?? '';
      const normalizedPhone = normalizePhoneNumber(rawPhone);

      if (!normalizedPhone) {
        return { status: 'otp_sent', error: 'Enter the phone number we texted the code to.' };
      }

      if (!otpCode || otpCode.length < 4) {
        return {
          status: 'otp_sent',
          phone: normalizedPhone,
          maskedPhone: maskPhoneNumber(normalizedPhone) ?? normalizedPhone,
          error: 'Enter the 6-digit code from your text message.',
        };
      }

      try {
        const { error: verifyError } = await supa.auth.verifyOtp({
          phone: normalizedPhone,
          token: otpCode,
          type: 'phone_change',
        });

        if (verifyError) {
          throw verifyError;
        }

        revalidatePath('/portal/profile');
        return {
          status: 'success',
          phone: normalizedPhone,
          message: 'Phone number verified.',
        };
      } catch (error) {
        const masked = maskPhoneNumber(normalizedPhone) ?? normalizedPhone;
        if (error instanceof Error) {
          return { status: 'otp_sent', phone: normalizedPhone, maskedPhone: masked, error: error.message };
        }
        return {
          status: 'otp_sent',
          phone: normalizedPhone,
          maskedPhone: masked,
          error: 'We could not verify that code. Try again.',
        };
      }
    }

    const rawPhone = (formData.get('phone') as string | null) ?? '';
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    if (!normalizedPhone) {
      return { status: 'idle', error: 'Enter a valid phone number with country code (e.g. +16475551234).' };
    }

    if (currentUser.phone && normalizePhoneNumber(currentUser.phone) === normalizedPhone) {
      return { status: 'idle', message: 'This phone number is already active on your account.' };
    }

    try {
      const { error } = await supa.auth.updateUser({ phone: normalizedPhone });
      if (error) {
        throw error;
      }

      return {
        status: 'otp_sent',
        phone: normalizedPhone,
        maskedPhone: maskPhoneNumber(normalizedPhone) ?? normalizedPhone,
        message: 'We sent a 6-digit verification code to your phone.',
      };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 'idle', error: error.message };
      }
      return { status: 'idle', error: 'We could not send a verification code. Try again shortly.' };
    }
  }

  async function updatePassword(_prevState: PasswordFormState, formData: FormData): Promise<UpdatePasswordResult> {
    'use server';

    const supa = await createSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supa.auth.getUser();

    if (!currentUser) {
      return { status: 'idle', error: 'Sign in to update your password.' };
    }

    const currentPassword = (formData.get('current_password') as string | null) ?? '';
    const newPassword = (formData.get('new_password') as string | null) ?? '';
    const confirmPassword = (formData.get('confirm_password') as string | null) ?? '';

    if (!currentPassword) {
      return { status: 'idle', error: 'Enter your current password to continue.' };
    }
    if (newPassword.length < 8) {
      return { status: 'idle', error: 'New password must be at least 8 characters.' };
    }
    if (newPassword !== confirmPassword) {
      return { status: 'idle', error: 'New passwords do not match.' };
    }

    try {
      if (currentUser.email) {
        const { error: reauthError } = await supa.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword,
        });
        if (reauthError) {
          return { status: 'idle', error: 'Current password is incorrect.' };
        }
      } else if (currentUser.phone) {
        const { error: reauthError } = await supa.auth.signInWithPassword({
          phone: currentUser.phone,
          password: currentPassword,
        });
        if (reauthError) {
          return { status: 'idle', error: 'Current password is incorrect.' };
        }
      } else {
        return {
          status: 'idle',
          error: 'No contact information found. Add an email or phone before updating the password.',
        };
      }

      const { error: updateError } = await supa.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      return { status: 'success', message: 'Password updated. Use your new password next time you sign in.' };
    } catch (error) {
      if (error instanceof Error) {
        return { status: 'idle', error: error.message };
      }
      return { status: 'idle', error: 'We could not update your password right now.' };
    }
  }

  const awaitingVerification = profile.affiliation_status === 'pending';
  const affiliationRevoked = profile.affiliation_status === 'revoked';
  const hasEmail = Boolean(initialEmail);
  const hasPhone = Boolean(initialPhone);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">Account settings</h1>
        <p className="text-sm text-on-surface/70">
          Keep your profile details and contact information up to date so neighbours know how you collaborate.
        </p>
      </header>

      {awaitingVerification ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-on-primary-container">
          We are confirming your agency or government role. You can keep contributing as a community member while we
          verify.
        </div>
      ) : null}

      {affiliationRevoked ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          Your verified affiliation was revoked. Reach out to IHARC administrators if circumstances have changed.
        </div>
      ) : null}

      <ProfileDetailsForm
        organizations={organizations}
        action={updateProfileDetails}
        initialState={INITIAL_PROFILE_STATE}
        initialValues={initialValues}
      />

      <ProfileContactCard
        initialEmail={initialEmail}
        initialPhone={initialPhone}
        emailAction={updateEmail}
        phoneAction={updatePhone}
        initialEmailState={INITIAL_EMAIL_STATE}
        initialPhoneState={INITIAL_PHONE_STATE}
      />

      <ProfilePasswordForm
        action={updatePassword}
        initialState={INITIAL_PASSWORD_STATE}
        hasEmail={hasEmail}
        hasPhone={hasPhone}
      />
    </div>
  );
}
