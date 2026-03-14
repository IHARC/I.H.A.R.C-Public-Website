'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TopNavDropdownItem } from '@/components/layout/top-nav-dropdown';

type MarketingLink = {
  type: 'link';
  href: string;
  label: string;
};

type MarketingMenu = {
  type: 'menu';
  label: string;
  items: TopNavDropdownItem[];
};

export type MarketingNavItem = MarketingLink | MarketingMenu;

type TopNavMobileProps = {
  links: MarketingNavItem[];
  accountSection?: ReactNode;
  quickAction?: ReactNode;
};

export function TopNavMobile({ links, accountSection, quickAction }: TopNavMobileProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  type MobileMenuItem = {
    type: 'menu';
    label: string;
    isActive: boolean;
    items: Array<TopNavDropdownItem & { isActive: boolean }>;
  };

  type MobileLinkItem = {
    type: 'link';
    href: string;
    label: string;
    isActive: boolean;
  };

  type MobileNavItem = MobileLinkItem | MobileMenuItem;

  const navSections = useMemo(() => {
    return [
      {
        id: 'marketing',
        title: 'Explore IHARC',
        items: links.map<MobileNavItem>((link) => {
          if (link.type === 'link') {
            const isHome = link.href === '/';
            const isActive = isHome ? pathname === '/' : pathname.startsWith(link.href);

            return {
              ...link,
              isActive,
            };
          }

          const mappedItems = link.items.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return {
              ...item,
              isActive,
            };
          });

          return {
            type: 'menu',
            label: link.label,
            items: mappedItems,
            isActive: mappedItems.some((item) => item.isActive),
          };
        }),
      },
    ];
  }, [links, pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 rounded-[var(--md-sys-shape-corner-small)] bg-transparent text-on-surface hover:bg-surface-container"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-navigation-drawer"
        onClick={() => setOpen((previous) => !previous)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" aria-hidden={!open}>
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          />
          <section
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className="absolute inset-y-0 left-0 flex h-full w-[min(22rem,100vw)] flex-col gap-6 bg-surface px-5 py-6 text-on-surface shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-left">
                <h2 id="mobile-navigation-title" className="text-xl font-semibold tracking-tight text-on-surface">
                  Navigation
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </Button>
            </div>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-8">
              <nav aria-label="Primary navigation" className="flex flex-col gap-6">
                {navSections.map((section) => (
                  <div key={section.id} className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-on-surface/80">
                      {section.title}
                    </p>
                    {section.items.map((item) =>
                      item.type === 'link' ? (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex min-h-11 items-center justify-between rounded-[var(--md-sys-shape-corner-small)] px-4 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                            item.isActive
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'text-on-surface hover:bg-surface-container-highest'
                          )}
                          aria-current={item.isActive ? 'page' : undefined}
                        >
                          <span>{item.label}</span>
                          {item.isActive ? (
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                              Active
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <MobileNavCollapsible key={item.label} item={item} closeSheet={() => setOpen(false)} />
                      )
                    )}
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
              {accountSection ? (
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
                    STEVI sign-in
                  </p>
                  {accountSection}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

type MobileNavCollapsibleProps = {
  item: {
    label: string;
    isActive: boolean;
    items: Array<TopNavDropdownItem & { isActive: boolean }>;
  };
  closeSheet: () => void;
};

function MobileNavCollapsible({ item, closeSheet }: MobileNavCollapsibleProps) {
  const [expanded, setExpanded] = useState(item.isActive);

  useEffect(() => {
    setExpanded(item.isActive);
  }, [item.isActive]);

  return (
    <div className={cn('rounded-[var(--md-sys-shape-corner-large)] border border-outline/15 bg-surface-container-low shadow-sm')}>
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className={cn(
          'flex w-full items-center justify-between rounded-[var(--md-sys-shape-corner-large)] px-4 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          item.isActive || expanded
            ? 'bg-secondary-container text-on-secondary-container'
            : 'text-on-surface hover:bg-surface-container-high'
        )}
        aria-expanded={expanded}
        aria-controls={`mobile-menu-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span>{item.label}</span>
        <div className="flex items-center gap-2">
          {item.isActive ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Active</span>
          ) : null}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', expanded ? 'rotate-180' : undefined)}
            aria-hidden
          />
        </div>
      </button>
      <div
        id={`mobile-menu-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn('gap-1 px-2 pb-2 pt-1 transition', expanded ? 'flex flex-col' : 'hidden')}
        aria-hidden={!expanded}
      >
        {item.items.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            onClick={closeSheet}
            className={cn(
              'rounded-[var(--md-sys-shape-corner-medium)] px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
              child.isActive
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface hover:bg-surface-container-high'
            )}
            aria-current={child.isActive ? 'page' : undefined}
          >
            <span className="block font-semibold">{child.label}</span>
            {child.description ? (
              <span className="mt-0.5 block text-xs text-on-surface/70">{child.description}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
