'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const DEFAULT_NEXT = '/portal/ideas';

export function AuthLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextParam = useMemo(() => {
    const searchString = searchParams.toString();
    const path = pathname ? `${pathname}${searchString ? `?${searchString}` : ''}` : DEFAULT_NEXT;

    if (!path.startsWith('/')) {
      return DEFAULT_NEXT;
    }

    return path || DEFAULT_NEXT;
  }, [pathname, searchParams]);

  const encodedNext = encodeURIComponent(nextParam);

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-on-surface/80">
      <Link
        href={`/login?next=${encodedNext}`}
        className="rounded-full border border-outline/40 bg-surface px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Sign in
      </Link>
      <Link
        href={`/register?next=${encodedNext}`}
        className="rounded-full bg-primary px-3 py-1 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Sign up
      </Link>
    </div>
  );
}
