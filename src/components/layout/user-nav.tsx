import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensurePortalProfile } from '@/lib/profile';
import { SignOutButton } from '@/components/auth/sign-out-button';

export async function UserNav() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Link href="/login" className="rounded-full border border-slate-200 px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:hover:bg-slate-800">
          Sign in
        </Link>
        <Link href="/register" className="rounded-full bg-brand px-3 py-1 text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          Register
        </Link>
      </div>
    );
  }

  const profile = await ensurePortalProfile(user.id);
  const role = profile.role;
  const displayName = profile.display_name || 'Community member';
  const positionTitle = profile.position_title;
  const awaitingVerification = profile.affiliation_status === 'pending';
  const affiliationRevoked = profile.affiliation_status === 'revoked';
  const showModeration = role === 'moderator' || role === 'admin';
  const showAdmin = role === 'admin';

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <div className="flex flex-col">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {displayName}
        </span>
        {positionTitle ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">{positionTitle}</span>
        ) : null}
        {awaitingVerification ? (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-300">Awaiting verification</span>
        ) : null}
        {affiliationRevoked ? (
          <span className="text-xs font-medium text-rose-600 dark:text-rose-300">Verification declined</span>
        ) : null}
      </div>
      <Link href="/solutions/profile" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
        Profile
      </Link>
      {showModeration ? (
        <Link href="/solutions/mod" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
          Moderation
        </Link>
      ) : null}
      {showAdmin ? (
        <Link href="/command-center/admin" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
          Admin
        </Link>
      ) : null}
      <SignOutButton action={signOut} />
    </div>
  );
}

async function signOut() {
  'use server';

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
