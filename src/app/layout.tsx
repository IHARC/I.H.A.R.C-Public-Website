import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'IHARC Command Center — Community Solutions Portal',
  description: 'View key metrics. Propose and refine solutions. Collaborate with neighbors, agencies, and the Town. No identifying details allowed.',
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
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand">IHARC Command Center</p>
                  <h1 className="text-2xl font-bold leading-tight">Community Solutions Portal</h1>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    View key metrics. Propose and refine solutions. Collaborate with neighbors, agencies, and the Town. No identifying details allowed.
                  </p>
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
