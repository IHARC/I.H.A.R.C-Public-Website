import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'IHARC — Northumberland Housing & Health Collaboration',
  description:
    'IHARC is the community front door for housing stability and overdose response collaboration across Northumberland County.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background text-on-background antialiased', inter.variable, 'font-sans')}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <NavBar />
            <main className="flex-1 bg-background">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
