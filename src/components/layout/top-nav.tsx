import Image from 'next/image';
import Link from 'next/link';
import { TopNavMobile, type MarketingNavItem } from '@/components/layout/top-nav-mobile';
import { TopNavLink } from '@/components/layout/top-nav-link';
import { getUserNavigation } from '@/components/layout/user-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { TopNavDropdown, type TopNavDropdownItem } from '@/components/layout/top-nav-dropdown';
import { steviPortalUrl } from '@/lib/stevi-portal';

const emergencyNavigation: TopNavDropdownItem[] = [
  {
    href: '/emergency',
    label: 'Emergency Declaration Brief',
    description: 'Understand why partners declared a housing and overdose emergency.',
  },
  {
    href: steviPortalUrl('/portal/petition/state-of-emergency'),
    label: 'Sign the Petition',
    description: 'Add your support so neighbours and Council advance emergency responses.',
  },
  {
    href: '/after-the-declaration',
    label: 'After the Declaration',
    description: 'See how Cobourg residents, agencies, and Council are collaborating now.',
  },
];

const marketingNavigation: MarketingNavItem[] = [
  { type: 'link', href: '/', label: 'Home' },
  { type: 'link', href: '/about', label: 'About' },
  { type: 'link', href: '/programs', label: 'Programs' },
  { type: 'link', href: '/data', label: 'Data' },
  { type: 'link', href: '/resources', label: 'Reports & Resources' },
  { type: 'link', href: '/get-help', label: 'Get Help' },
  { type: 'link', href: '/news', label: 'News' },
  { type: 'menu', label: 'Emergency Response', items: emergencyNavigation },
];

export async function TopNav() {
  const { desktop: userNavigation, mobile: mobileUserNavigation } = await getUserNavigation();
  const steviHomeUrl = steviPortalUrl('/');

  const portalCtaDesktop = (
    <Link
      href={steviHomeUrl}
      className="hidden items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:inline-flex"
      prefetch={false}
    >
      Open STEVI Portal
    </Link>
  );

  const portalCtaMobile = (
    <Link
      href={steviHomeUrl}
      className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-base font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      prefetch={false}
    >
      Open STEVI Portal
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
              {marketingNavigation.map((item) =>
                item.type === 'link' ? (
                  <TopNavLink key={item.href} href={item.href}>
                    {item.label}
                  </TopNavLink>
                ) : (
                  <TopNavDropdown key={item.label} label={item.label} items={item.items} />
                )
              )}
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
