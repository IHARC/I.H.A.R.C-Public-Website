import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export const dynamic = 'force-dynamic';

type FormState = {
  error?: string;
};

export default async function LoginPage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/command-center');
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

    redirect('/command-center');
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Welcome back</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sign in to up-vote ideas, leave respectful comments, and manage community project board commitments.
        </p>
      </div>
      <LoginForm action={loginUser} />
    </div>
  );
}
