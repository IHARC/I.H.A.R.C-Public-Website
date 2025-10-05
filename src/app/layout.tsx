import type { Metadata } from 'next';
import { Roboto, Roboto_Flex } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-body' });
const robotoFlex = Roboto_Flex({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'IHARC — Northumberland Housing & Health Collaboration',
  description:
    'IHARC is the community front door for housing stability and overdose response collaboration across Northumberland County.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    title: 'IHARC — Northumberland Housing & Health Collaboration',
    description:
      'IHARC is the community front door for housing stability and overdose response collaboration across Northumberland County.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'IHARC Command Center — Community collaboration for housing and health',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IHARC — Northumberland Housing & Health Collaboration',
    description:
      'Neighbours, agencies, and local government co-design rapid housing and overdose solutions together.',
    images: ['/og-default.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background text-on-background antialiased',
          roboto.variable,
          robotoFlex.variable,
          'font-sans'
        )}
      >
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col bg-background">
            <NavBar />
            <main id="main-content" className="flex-1 bg-background">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
