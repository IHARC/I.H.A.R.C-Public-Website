import Image from 'next/image';
import Link from 'next/link';
import { TopNavMobile } from '@/components/layout/top-nav-mobile';
import { TopNavLink } from '@/components/layout/top-nav-link';
import { UserNav } from '@/components/layout/user-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const marketingLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/programs', label: 'Programs' },
  { href: '/data', label: 'Data' },
  { href: '/get-help', label: 'Get Help' },
  { href: '/news', label: 'News' },
  { href: '/emergency', label: 'Emergency' },
];

export async function TopNav() {
  const userNavigation = await UserNav();

  return (
    <header className="border-b border-outline/20 bg-surface/95 text-on-surface backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
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
            <div className="lg:hidden">
              <TopNavMobile links={marketingLinks} />
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Marketing pages" className="hidden flex-wrap items-center gap-1.5 lg:flex">
              {marketingLinks.map((link) => (
                <TopNavLink key={link.href} href={link.href}>
                  {link.label}
                </TopNavLink>
              ))}
            </nav>
            <div className="flex flex-col gap-3 lg:min-w-[24rem] lg:flex-row lg:items-center lg:justify-end lg:gap-3">
              <Link
                href="/portal/ideas"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:w-auto"
              >
                Open Collaboration Portal
              </Link>
              <div className="flex items-center justify-end gap-2">
                <ThemeToggle />
                {userNavigation}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
