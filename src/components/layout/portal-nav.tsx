'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PortalLink = {
  href: string;
  label: string;
  exact?: boolean;
};

export const portalLinks: PortalLink[] = [
  { href: '/portal/petition', label: 'Petition' },
  { href: '/portal/ideas', label: 'Ideas', exact: false },
  { href: '/portal/plans', label: 'Plans' },
  { href: '/portal/progress', label: 'Progress' },
  { href: '/portal/about', label: 'About' },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Portal navigation"
      className="border-b border-outline/10 bg-surface-container text-on-surface"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative -mx-4">
          <div
            className="flex items-center gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:'none'] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:px-0"
            role="list"
          >
            {portalLinks.map((link) => (
              <PortalNavLink key={link.href} href={link.href} exact={link.exact} pathname={pathname}>
                {link.label}
              </PortalNavLink>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-surface-container to-transparent sm:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface-container to-transparent sm:hidden"
            aria-hidden
          />
        </div>
      </div>
    </nav>
  );
}

type PortalNavLinkProps = {
  href: string;
  exact?: boolean;
  pathname: string;
  children: ReactNode;
};

function PortalNavLink({ href, children, exact, pathname }: PortalNavLinkProps) {
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container',
        active
          ? 'bg-primary text-on-primary shadow'
          : 'text-on-surface/80 hover:bg-brand-soft hover:text-brand'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
