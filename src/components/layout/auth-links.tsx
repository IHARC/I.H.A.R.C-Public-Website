'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { steviPortalUrl } from '@/lib/stevi-portal';

type AuthLinksProps = {
  layout?: 'inline' | 'stacked';
};

const SIGN_IN_URL = steviPortalUrl('/login');
const SIGN_UP_URL = steviPortalUrl('/register');

export function AuthLinks({ layout = 'inline' }: AuthLinksProps = {}) {
  const isStacked = layout === 'stacked';

  return (
    <div
      className={cn(
        'text-sm font-semibold text-on-surface/80',
        isStacked ? 'flex flex-col gap-2' : 'flex items-center gap-2'
      )}
    >
      <Link
        href={SIGN_IN_URL}
        prefetch={false}
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-outline/40 bg-surface text-on-surface/80 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          isStacked ? 'w-full px-4 py-2' : 'px-3 py-1'
        )}
      >
        Sign in
      </Link>
      <Link
        href={SIGN_UP_URL}
        prefetch={false}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          isStacked ? 'w-full px-4 py-2' : 'px-3 py-1'
        )}
      >
        Request access
      </Link>
    </div>
  );
}
