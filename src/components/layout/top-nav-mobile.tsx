'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { portalLinks } from '@/components/layout/portal-nav';
import { cn } from '@/lib/utils';

type MarketingLink = {
  href: string;
  label: string;
};

type TopNavMobileProps = {
  links: MarketingLink[];
  accountSection: ReactNode;
  quickAction?: ReactNode;
};

export function TopNavMobile({ links, accountSection, quickAction }: TopNavMobileProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onPortalRoute = pathname.startsWith('/portal');

  const navSections = useMemo(
    () => [
      {
        id: 'marketing',
        title: 'Explore IHARC',
        items: links.map((link) => {
          const isHome = link.href === '/';
          const isActive = isHome ? pathname === '/' : pathname.startsWith(link.href);

          return {
            ...link,
            isActive,
          };
        }),
      },
      ...(onPortalRoute
        ? [
            {
              id: 'portal',
              title: 'Collaboration Portal',
              items: portalLinks.map((link) => {
                const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);

                return {
                  ...link,
                  isActive,
                };
              }),
            },
          ]
        : []),
    ],
    [links, onPortalRoute, pathname]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-transparent text-on-surface hover:bg-surface-container"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-full w-[min(22rem,100vw)] flex-col gap-6 border-none bg-surface px-5 py-6 text-on-surface shadow-lg"
      >
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight text-on-surface">
            Navigation
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-8">
          <nav aria-label="Primary navigation" className="flex flex-col gap-6">
            {navSections.map((section) => (
              <div key={section.id} className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold uppercase tracking-wide text-on-surface/80">
                  {section.title}
                </p>
                {section.items.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-full px-4 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                      link.isActive
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'text-on-surface hover:bg-surface-container-highest'
                    )}
                    aria-current={link.isActive ? 'page' : undefined}
                  >
                    <span>{link.label}</span>
                    {link.isActive ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Active
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          {quickAction ? (
            <div
              className="flex flex-col gap-2"
              onClickCapture={(event) => {
                const target = event.target as HTMLElement | null;
                if (!target) {
                  return;
                }
                if (target.closest('a[href],button')) {
                  setOpen(false);
                }
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-on-surface/80">
                Quick action
              </p>
              {quickAction}
            </div>
          ) : null}
          <div
            className="flex flex-col gap-2"
            onClickCapture={(event) => {
              const target = event.target as HTMLElement | null;
              if (!target) {
                return;
              }
              if (target.closest('a[href],button')) {
                setOpen(false);
              }
            }}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-on-surface/80">
              Account
            </p>
            {accountSection}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
