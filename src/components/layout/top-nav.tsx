import Image from 'next/image';
import Link from 'next/link';
import { TopNavLink } from '@/components/layout/top-nav-link';
import { UserNav } from '@/components/layout/user-nav';
import { siteConfig } from '@/config/site';

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
  const {
    emergency: { enabled: emergencyEnabled },
  } = siteConfig;

  return (
    <header className="border-b border-outline/20 bg-surface/95 text-on-surface backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {emergencyEnabled ? (
        <div className="border-b border-outline/20 bg-brand-soft text-sm text-brand">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">
              IHARC has urged Cobourg to declare a <strong className="font-semibold">State of Emergency</strong> to coordinate housing and overdose response.
            </p>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-1 font-semibold underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-soft"
            >
              Learn why
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
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
          <nav aria-label="Marketing pages" className="flex flex-nowrap items-center gap-1.5 overflow-x-auto">
            {marketingLinks.map((link) => (
              <TopNavLink key={link.href} href={link.href}>
                {link.label}
              </TopNavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 lg:flex-nowrap">
          <Link
            href="/portal/ideas"
            className="rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Open Collaboration Portal
          </Link>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
