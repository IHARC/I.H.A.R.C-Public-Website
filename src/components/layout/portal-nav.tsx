'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PortalLink = {
  href: string;
  label: string;
  exact?: boolean;
};

const links: PortalLink[] = [
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
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3">
        {links.map((link) => (
          <PortalNavLink key={link.href} href={link.href} exact={link.exact} pathname={pathname}>
            {link.label}
          </PortalNavLink>
        ))}
      </div>
    </nav>
  );
}

type PortalNavLinkProps = PortalLink & {
  children: ReactNode;
  pathname: string;
};

function PortalNavLink({ href, children, exact, pathname }: PortalNavLinkProps) {
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container',
        active ? 'bg-primary text-on-primary shadow' : 'text-on-surface/80 hover:bg-brand-soft hover:text-brand'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
