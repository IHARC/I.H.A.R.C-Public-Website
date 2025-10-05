import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';
import { resolveNextPath, parseAuthErrorCode, type AuthErrorCode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type FormState = {
  error?: string;
};

type SearchParams = Record<string, string | string[]>;

type LoginPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? undefined;

  const nextPath = resolveNextPath(resolvedSearchParams?.next);
  const authErrorCode = parseAuthErrorCode(resolvedSearchParams?.error);
  const initialError = authErrorCode ? getAuthErrorMessage(authErrorCode) : null;

  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  async function loginUser(_prevState: FormState, formData: FormData): Promise<FormState> {
    'use server';

    const email = (formData.get('email') as string | null)?.trim().toLowerCase();
    const password = (formData.get('password') as string | null) ?? '';

    if (!email) {
      return { error: 'Enter the email you used to register.' };
    }
    if (!password) {
      return { error: 'Enter your password to continue.' };
    }

    try {
      const supa = await createSupabaseServerClient();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Unable to sign you in right now.' };
    }

    redirect(nextPath);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Welcome back</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sign in to up-vote ideas, leave respectful comments, and manage community project board commitments.
        </p>
      </div>
      <LoginForm action={loginUser} nextPath={nextPath} initialError={initialError} />
    </div>
  );
}

function getAuthErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'google_auth_cancelled':
      return 'Google sign-in was cancelled. Try again when you are ready.';
    case 'google_auth_error':
    default:
      return 'We could not connect to Google right now. Please try again.';
  }
}
