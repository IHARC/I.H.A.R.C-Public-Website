import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { RegisterForm } from '@/components/auth/register-form';

export const dynamic = 'force-dynamic';

type FormState = {
  error?: string;
};

export default async function RegisterPage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/command-center');
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
    const organizationId = (formData.get('organization_id') as string | null)?.trim() || null;

    if (!email || !email.includes('@')) {
      return { error: 'Enter a valid email address.' };
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

      await ensurePortalProfile(createdUser.id, {
        display_name: displayName,
        organization_id: organizationId,
        role: 'user',
      });
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Unable to complete registration right now.' };
    }

    redirect('/command-center');
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Create your IHARC account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You will be able to adjust your profile and community participation rules after signing in.
        </p>
      </div>
      <RegisterForm organizations={organizations ?? []} action={registerUser} />
    </div>
  );
}
