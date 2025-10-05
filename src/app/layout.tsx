import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { UserNav } from '@/components/layout/user-nav';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'IHARC Command Center — Community Collaboration Portal',
  description:
    'View key metrics. Co-design humane responses. Collaborate with neighbours, agencies, and the Town. No identifying details allowed.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background text-on-background antialiased',
          inter.variable,
          'font-sans',
        )}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-outline/40 bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75 dark:border-outline/30 dark:bg-neutral-black/90">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-3 rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    aria-label="IHARC Command Center home"
                  >
                    <Image src="/logos/logo-default.png" alt="IHARC" width={160} height={48} priority />
                    <span className="sr-only">IHARC Command Center</span>
                  </Link>
                  <h1 className="text-2xl font-bold leading-tight text-on-surface">
                    Ideas, plans, and progress rooted in dignity
                  </h1>
                  <p className="max-w-2xl text-sm text-on-surface/80">
                    Follow real-time housing and public health indicators, see which ideas are moving forward, and learn how to help in ways that support neighbours without sharing identifying details.
                  </p>
                </div>
                <div className="flex flex-col gap-3 lg:items-end">
                  <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-on-surface/80">
                    <Link
                      href="/ideas"
                      className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      Ideas
                    </Link>
                    <Link
                      href="/plans"
                      className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      Plans
                    </Link>
                    <Link
                      href="/progress"
                      className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      Progress
                    </Link>
                    <Link
                      href="/about"
                      className="rounded-full px-3 py-1 transition hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      About
                    </Link>
                  </nav>
                  <UserNav />
                </div>
              </div>
            </header>
            <main className="flex-1 bg-background">{children}</main>
            <footer className="border-t border-outline/40 bg-surface px-4 py-6 text-center text-xs text-on-surface/70">
              © {new Date().getFullYear()} IHARC — Inclusive, accessible, community-first data platform.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
