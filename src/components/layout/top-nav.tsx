import Image from 'next/image';
import Link from 'next/link';
import { TopNavMobile, type MarketingNavItem } from '@/components/layout/top-nav-mobile';
import { TopNavLink } from '@/components/layout/top-nav-link';
import { getUserNavigation } from '@/components/layout/user-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getMarketingNavigation } from '@/data/marketing-content';
import { steviPortalUrl } from '@/lib/stevi-portal';

export async function TopNav() {
  const { items, portalCtaLabel } = await getMarketingNavigation();
  const marketingNavigation: MarketingNavItem[] = items.map((item) => ({
    type: 'link',
    href: item.href,
    label: item.label,
  }));
  const { desktop: userNavigation, mobile: mobileUserNavigation } = await getUserNavigation();
  const steviHomeUrl = steviPortalUrl('/');

  const portalCtaDesktop = (
    <Link
      href={steviHomeUrl}
      className="hidden items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:inline-flex"
      prefetch={false}
    >
      {portalCtaLabel || 'STEVI'}
    </Link>
  );

  const portalCtaMobile = (
    <Link
      href={steviHomeUrl}
      className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-base font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      prefetch={false}
    >
      {portalCtaLabel || 'STEVI'}
    </Link>
  );

  return (
    <header className="border-b border-outline/20 bg-surface/95 text-on-surface backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="IHARC home"
            >
              <Image
                src="/logos/logo-default.png"
                alt="IHARC"
                width={160}
                height={48}
                priority
                className="dark:hidden"
              />
              <Image
                src="/logos/logoinverted.png"
                alt="IHARC"
                width={160}
                height={48}
                priority
                className="hidden dark:block"
              />
            </Link>
            <nav aria-label="Marketing pages" className="hidden flex-1 flex-wrap items-center gap-1.5 lg:flex">
              {marketingNavigation
                .filter((item): item is Extract<MarketingNavItem, { type: 'link' }> => item.type === 'link')
                .map((item) => (
                  <TopNavLink key={item.href} href={item.href}>
                    {item.label}
                  </TopNavLink>
                ))}
            </nav>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {portalCtaDesktop}
            <ThemeToggle />
            {userNavigation}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <TopNavMobile
              links={marketingNavigation}
              accountSection={mobileUserNavigation}
              quickAction={portalCtaMobile}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
