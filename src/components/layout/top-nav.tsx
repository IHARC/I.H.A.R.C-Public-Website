import Image from 'next/image';
import Link from 'next/link';
import { TopNavDropdown, type TopNavDropdownItem } from '@/components/layout/top-nav-dropdown';
import { TopNavMobile, type MarketingNavItem } from '@/components/layout/top-nav-mobile';
import { TopNavLink } from '@/components/layout/top-nav-link';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getMarketingNavigation, getBrandingAssets } from '@/data/marketing-content';
import { steviPortalUrl } from '@/lib/stevi-portal';

type NavItem = {
  label: string;
  href: string;
};

const isPresent = <T,>(value: T | null | undefined): value is T => Boolean(value);

function buildGroupedNavigation(items: NavItem[]): MarketingNavItem[] {
  const itemsByHref = new Map(items.map((item) => [item.href, item]));
  const used = new Set<string>();

  const createDropdownItem = (
    href: string,
    fallbackLabel: string,
    description?: string,
  ): TopNavDropdownItem | null => {
    const match = itemsByHref.get(href);
    if (!match) return null;
    used.add(href);
    return {
      href,
      label: match.label || fallbackLabel,
      description,
    };
  };

  const createLinkItem = (href: string, fallbackLabel: string): MarketingNavItem | null => {
    const match = itemsByHref.get(href);
    if (!match) return null;
    used.add(href);
    return {
      type: 'link',
      href,
      label: match.label || fallbackLabel,
    };
  };

  const navigation: MarketingNavItem[] = [];

  const homeLink = createLinkItem('/', 'Home');
  if (homeLink) {
    navigation.push(homeLink);
  }

  const groupedMenus: Array<{ label: string; items: TopNavDropdownItem[] }> = [
    {
      label: 'About IHARC',
      items: [
        createDropdownItem('/about', 'About IHARC', 'What IHARC is and how we collaborate.'),
        createDropdownItem('/context', 'Local context', 'How homelessness and overdoses show up in Northumberland.'),
        createDropdownItem('/myth-busting', 'Myth busting', 'Evidence that challenges stigma and misconceptions.'),
        createDropdownItem('/news', 'News & updates', 'Latest announcements, press, and stories.'),
      ].filter(isPresent),
    },
    {
      label: 'Support & Programs',
      items: [
        createDropdownItem('/get-help', 'Get help', 'Crisis lines, outreach, and immediate supports.'),
        createDropdownItem('/programs', 'Programs', 'Active initiatives, services, and pilots.'),
        createDropdownItem('/resources', 'Resources', 'Guides and tools for neighbours, staff, and partners.'),
        createDropdownItem('/donate', 'Donate', 'Ways to invest in community-first response.'),
      ].filter(isPresent),
    },
    {
      label: 'Data & Accountability',
      items: [
        createDropdownItem('/stats', 'Community status', 'Live dashboards on calls, outreach, and flow.'),
        createDropdownItem('/data', 'Data stories', 'Point-in-time counts and trend explainers.'),
        createDropdownItem('/transparency', 'Transparency', 'Governance, budgets, and stewardship commitments.'),
        createDropdownItem('/policies', 'Policies', 'Published policies and privacy commitments.'),
      ].filter(isPresent),
    },
  ];

  groupedMenus.forEach((menu) => {
    if (menu.items.length) {
      navigation.push({
        type: 'menu',
        label: menu.label,
        items: menu.items,
      });
    }
  });

  const remaining = items.filter((item) => !used.has(item.href));
  if (remaining.length) {
    navigation.push({
      type: 'menu',
      label: 'More',
      items: remaining.map((item) => ({
        href: item.href,
        label: item.label,
      })),
    });
  }

  return navigation;
}

export async function TopNav() {
  const { items, portalCtaLabel: portalCtaLabelSetting } = await getMarketingNavigation();
  const branding = await getBrandingAssets();
  const lightLogo = branding?.logoLightUrl || '/logos/logo-default.png';
  const darkLogo = branding?.logoDarkUrl || '/logos/logoinverted.png';
  const donateNavItem = items.find((item) => item.href === '/donate');
  const marketingNavigation = buildGroupedNavigation(items.filter((item) => item.href !== '/donate'));
  const steviHomeUrl = steviPortalUrl('/');
  const portalCtaLabel = portalCtaLabelSetting || 'Access S.T.E.V.I.';
  const donateCtaLabel = donateNavItem?.label || 'Donate';

  const getHelpCtaDesktop = (
    <Link
      href="/get-help"
      className="hidden items-center justify-center rounded-[var(--md-sys-shape-corner-small)] bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-md transition hover:bg-primary/92 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:inline-flex"
    >
      Get help
    </Link>
  );

  const getHelpCtaMobile = (
    <Link
      href="/get-help"
      className="inline-flex w-full items-center justify-center rounded-[var(--md-sys-shape-corner-small)] bg-primary px-4 py-3 text-base font-semibold text-on-primary shadow-md transition hover:bg-primary/92 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      Get help
    </Link>
  );

  const portalCtaDesktop = (
    <Link
      href={steviHomeUrl}
      className="hidden items-center justify-center rounded-[var(--md-sys-shape-corner-small)] border border-outline/40 px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:inline-flex"
      prefetch={false}
    >
      {portalCtaLabel}
    </Link>
  );

  const portalCtaMobile = (
    <Link
      href={steviHomeUrl}
      className="inline-flex w-full items-center justify-center rounded-[var(--md-sys-shape-corner-small)] border border-outline/40 px-4 py-3 text-base font-semibold text-on-surface transition hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      prefetch={false}
    >
      {portalCtaLabel}
    </Link>
  );

  const donateCtaDesktop = (
    <Link
      href="/donate"
      className="hidden items-center justify-center rounded-[var(--md-sys-shape-corner-small)] bg-tertiary px-4 py-2 text-sm font-semibold text-on-tertiary shadow-md shadow-tertiary/30 transition hover:bg-tertiary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:inline-flex"
      prefetch={false}
    >
      {donateCtaLabel}
    </Link>
  );

  const donateCtaMobile = (
    <Link
      href="/donate"
      className="inline-flex w-full items-center justify-center rounded-[var(--md-sys-shape-corner-small)] bg-tertiary px-4 py-3 text-base font-semibold text-on-tertiary shadow-md transition hover:bg-tertiary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      prefetch={false}
    >
      {donateCtaLabel}
    </Link>
  );

  return (
    <header className="border-b border-outline/20 bg-surface/95 text-on-surface backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto w-full max-w-7xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="IHARC home"
            >
              <Image
                src={lightLogo}
                alt="IHARC"
                width={160}
                height={48}
                priority
                className="dark:hidden"
              />
              <Image
                src={darkLogo}
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
                ),
              )}
            </nav>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {getHelpCtaDesktop}
            {donateCtaDesktop}
            {portalCtaDesktop}
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <TopNavMobile
              links={marketingNavigation}
              quickAction={
                <div className="flex flex-col gap-2">
                  {getHelpCtaMobile}
                  {donateCtaMobile}
                  {portalCtaMobile}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
