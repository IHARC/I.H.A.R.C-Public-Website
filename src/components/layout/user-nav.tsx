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
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface/80">
        <Link
          href="/login"
          className="rounded-full border border-outline/40 bg-surface px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-primary px-3 py-1 text-on-primary shadow transition hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Register
        </Link>
      </div>
    );
  }

  const profile = await ensurePortalProfile(supabase, user.id);
  const role = profile.role;
  const displayName = profile.display_name || 'Community member';
  const positionTitle = profile.position_title;
  const awaitingVerification = profile.affiliation_status === 'pending';
  const affiliationRevoked = profile.affiliation_status === 'revoked';
  const showModeration = role === 'moderator' || role === 'admin';
  const showAdmin = role === 'admin';

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface/80">
      <div className="flex flex-col">
        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface">
          {displayName}
        </span>
        {positionTitle ? (
          <span className="text-xs text-on-surface/60">{positionTitle}</span>
        ) : null}
        {awaitingVerification ? (
          <span className="text-xs font-medium text-amber-600">Awaiting verification</span>
        ) : null}
        {affiliationRevoked ? (
          <span className="text-xs font-medium text-rose-600">Verification declined</span>
        ) : null}
      </div>
      <Link
        href="/solutions/profile"
        className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Profile
      </Link>
      {showModeration ? (
        <Link
          href="/solutions/mod"
          className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Moderation
        </Link>
      ) : null}
      {showAdmin ? (
        <Link
          href="/command-center/admin"
          className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
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
