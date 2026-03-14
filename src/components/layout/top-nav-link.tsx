'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TopNavLinkProps = {
  href: string;
  children: ReactNode;
};

export function TopNavLink({ href, children }: TopNavLinkProps) {
  const pathname = usePathname();
  const isHomeLink = href === '/';
  const isActive = isHomeLink ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-10 items-center rounded-[var(--md-sys-shape-corner-small)] px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        isActive
          ? 'bg-primary-container text-on-primary-container'
          : 'text-on-surface/80 hover:bg-primary-container hover:text-on-primary-container'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
