import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import type { PortalProfile } from '@/lib/profile';
import { RegisterForm } from '@/components/auth/register-form';
import { resolveNextPath, parseAuthErrorCode, type AuthErrorCode } from '@/lib/auth';
import { NO_ORGANIZATION_VALUE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type FormState = {
  error?: string;
};

const ALLOWED_AFFILIATIONS: PortalProfile['affiliation_type'][] = [
  'community_member',
  'agency_partner',
  'government_partner',
];

type SearchParams = Record<string, string | string[]>;

type RegisterPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const nextPath = resolveNextPath(resolvedSearchParams?.next);
  const authErrorCode = parseAuthErrorCode(resolvedSearchParams?.error);
  const initialError = authErrorCode ? getRegisterAuthErrorMessage(authErrorCode) : null;

  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name')
    .order('name', { ascending: true });

  async function registerUser(_prevState: FormState, formData: FormData): Promise<FormState> {
    'use server';

    const email = (formData.get('email') as string | null)?.trim().toLowerCase();
    const password = (formData.get('password') as string | null) ?? '';
    const displayName = (formData.get('display_name') as string | null)?.trim();
    const rawOrganizationId = (formData.get('organization_id') as string | null)?.trim();
    const organizationId = rawOrganizationId && rawOrganizationId !== NO_ORGANIZATION_VALUE ? rawOrganizationId : null;
    const positionTitle = (formData.get('position_title') as string | null)?.trim() || null;
    const rawAffiliation = (formData.get('affiliation_type') as string | null)?.trim() || 'community_member';
    const affiliationType = ALLOWED_AFFILIATIONS.includes(rawAffiliation as PortalProfile['affiliation_type'])
      ? (rawAffiliation as PortalProfile['affiliation_type'])
      : 'community_member';
    const affiliationStatus: PortalProfile['affiliation_status'] =
      affiliationType === 'community_member' ? 'approved' : 'pending';
    const affiliationRequestedAt = affiliationStatus === 'pending' ? new Date().toISOString() : null;

    if (!email || !email.includes('@')) {
      return { error: 'Enter a valid email address.' };
    }
    if (affiliationType !== 'community_member' && !positionTitle) {
      return { error: 'Share the position or role you hold with your agency or government team.' };
    }
    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters.' };
    }
    if (!displayName || displayName.length < 2) {
      return { error: 'Share the name you would like neighbours to see.' };
    }

    try {
      const supa = await createSupabaseServerClient();
      const { error: signUpError } = await supa.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        return { error: signUpError.message };
      }

      const { error: signInError } = await supa.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { error: signInError.message };
      }

      const {
        data: { user: createdUser },
        error: userError,
      } = await supa.auth.getUser();

      if (userError || !createdUser) {
        return { error: 'Account created, but we could not establish a session. Try signing in.' };
      }

      type InviteRow = {
        id: string;
        affiliation_type: PortalProfile['affiliation_type'];
        position_title: string | null;
        organization_id: string | null;
        invited_by_profile_id: string | null;
        created_at: string;
      };

      let invite: InviteRow | null = null;
      const { data: inviteData, error: inviteError } = await supa.rpc('portal_get_pending_invite', {
        p_email: email,
      });

      if (inviteError) {
        console.error('Unable to load pending invite for registration', inviteError);
      } else if (inviteData) {
        invite = inviteData as InviteRow;
      }

      let profileRole: PortalProfile['role'] = 'user';
      let finalAffiliationType = affiliationType;
      let finalAffiliationStatus = affiliationStatus;
      let finalOrganizationId = organizationId;
      let finalPositionTitle = positionTitle;
      let finalAffiliationRequestedAt = affiliationRequestedAt;
      let affiliationReviewedAt: string | null = null;
      let affiliationReviewedBy: string | null = null;

      if (invite) {
        finalAffiliationType = invite.affiliation_type;
        finalAffiliationStatus = 'approved';
        profileRole = invite.affiliation_type === 'community_member' ? 'user' : 'org_rep';
        finalOrganizationId = finalOrganizationId ?? invite.organization_id ?? null;
        finalPositionTitle = finalPositionTitle ?? invite.position_title ?? null;
        finalAffiliationRequestedAt = invite.created_at ?? finalAffiliationRequestedAt;
        affiliationReviewedAt = new Date().toISOString();
        affiliationReviewedBy = invite.invited_by_profile_id;
      }

      const profile = await ensurePortalProfile(supa, createdUser.id, {
        display_name: displayName,
        organization_id: finalOrganizationId,
        position_title: finalPositionTitle,
        role: profileRole,
        affiliation_type: finalAffiliationType,
        affiliation_status: finalAffiliationStatus,
        affiliation_requested_at: finalAffiliationRequestedAt,
        affiliation_reviewed_at: affiliationReviewedAt,
        affiliation_reviewed_by: affiliationReviewedBy,
      });

      if (invite) {
        const { error: acceptError } = await supa.rpc('portal_accept_invite', {
          p_invite_id: invite.id,
          p_profile_id: profile.id,
        });
        if (acceptError) {
          console.error('Unable to mark invite as accepted', acceptError);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Unable to complete registration right now.' };
    }

    redirect(nextPath);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Create your IHARC account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You will be able to adjust your profile and community participation rules after signing in.
        </p>
      </div>
      <RegisterForm organizations={organizations ?? []} action={registerUser} nextPath={nextPath} initialError={initialError} />
    </div>
  );
}

function getRegisterAuthErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'google_auth_cancelled':
      return 'Google sign-up was cancelled. You can continue at any time.';
    case 'google_auth_error':
    default:
      return 'We could not finish sign-up with Google right now. Please try again.';
  }
}
