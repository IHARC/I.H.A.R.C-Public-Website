'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type MenuItem = {
  href: string;
  label: string;
};

type MobileAccountNavProps = {
  displayName: string;
  positionTitle?: string;
  awaitingVerification: boolean;
  affiliationRevoked: boolean;
  initials: string;
  menuItems: MenuItem[];
  signOutAction: () => Promise<void>;
};

export function MobileAccountNav({
  displayName,
  positionTitle,
  awaitingVerification,
  affiliationRevoked,
  initials,
  menuItems,
  signOutAction,
}: MobileAccountNavProps) {
  const [pending, startTransition] = useTransition();

  return (
    <section
      aria-label="Account options"
      className="rounded-2xl border border-outline/10 bg-surface-container-low px-4 py-5 text-on-surface shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-brand-soft text-sm font-semibold uppercase text-brand">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          {positionTitle ? (
            <p className="text-xs text-on-surface/70">{positionTitle}</p>
          ) : null}
        </div>
      </div>
      {awaitingVerification || affiliationRevoked ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
          {awaitingVerification ? (
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-primary">
              Awaiting verification
            </span>
          ) : null}
          {affiliationRevoked ? (
            <span className="inline-flex rounded-full bg-inverse-surface/10 px-2 py-1 text-inverse-on-surface">
              Verification declined
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex w-full items-center justify-between rounded-full border border-outline/20 bg-surface px-4 py-2 text-sm font-semibold text-on-surface/90 transition hover:border-primary/40 hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span>{item.label}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">
              Open
            </span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => startTransition(() => signOutAction())}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-outline px-4 py-2 text-sm font-semibold text-inverse-on-surface transition hover:bg-outline/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-70"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </section>
  );
}
