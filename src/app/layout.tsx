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
      <body className={cn('min-h-screen bg-slate-50 text-slate-900 antialiased', inter.variable, 'font-sans')}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/80">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <Link href="/" className="text-sm font-semibold uppercase tracking-wide text-brand">
                    IHARC Community Portal
                  </Link>
                  <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-50">
                    Ideas, plans, and progress rooted in dignity
                  </h1>
                  <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    Follow real-time housing and public health indicators, see which ideas are moving forward, and learn how to help in ways that support neighbours without sharing identifying details.
                  </p>
                </div>
                <div className="flex flex-col gap-3 lg:items-end">
                  <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Link href="/ideas" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
                      Ideas
                    </Link>
                    <Link href="/plans" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
                      Plans
                    </Link>
                    <Link href="/progress" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
                      Progress
                    </Link>
                    <Link href="/about" className="rounded-full px-3 py-1 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-slate-800">
                      About
                    </Link>
                  </nav>
                  <UserNav />
                </div>
              </div>
            </header>
            <main className="flex-1 bg-slate-50 dark:bg-slate-950">{children}</main>
            <footer className="border-t border-slate-200 bg-white/80 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/80">
              © {new Date().getFullYear()} IHARC — Inclusive, accessible, community-first data platform.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
