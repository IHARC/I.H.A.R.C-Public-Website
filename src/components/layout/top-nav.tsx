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
        <div className="flex items-center gap-3">
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
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <nav aria-label="Marketing pages" className="hidden flex-1 flex-wrap items-center gap-1.5 lg:flex">
              {marketingLinks.map((link) => (
                <TopNavLink key={link.href} href={link.href}>
                  {link.label}
                </TopNavLink>
              ))}
            </nav>
            <div className="flex flex-1 items-center justify-end gap-3">
              <Link
                href="/portal/ideas"
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Open Collaboration Portal
              </Link>
              <ThemeToggle />
              {userNavigation}
            </div>
          </div>
          <div className="flex flex-1 justify-end lg:hidden">
            <TopNavMobile links={marketingLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
