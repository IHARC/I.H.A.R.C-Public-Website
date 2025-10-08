import type { Metadata } from 'next';
import { Roboto, Roboto_Flex } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

const DEFAULT_APP_URL = 'https://iharc.ca';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_APP_URL;
const metadataBase = (() => {
  try {
    return new URL(appUrl);
  } catch {
    return new URL(DEFAULT_APP_URL);
  }
})();

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-body' });
const robotoFlex = Roboto_Flex({ subsets: ['latin'], variable: '--font-heading' });

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_ID ?? process.env.PUBLIC_GA4_ID ?? null;
const ANALYTICS_DISABLED = (process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? 'false').toLowerCase() === 'true';
const RESPECT_DNT = (process.env.NEXT_PUBLIC_ANALYTICS_RESPECT_DNT ?? 'true').toLowerCase() !== 'false';
const ENABLE_IN_DEV = (process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS_IN_DEV ?? process.env.PUBLIC_ENABLE_INTEGRATIONS_IN_DEV ?? '').toLowerCase() === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';
const ANALYTICS_ENABLED = Boolean(GA_MEASUREMENT_ID) && !ANALYTICS_DISABLED && (!IS_DEV || ENABLE_IN_DEV);

export const metadata: Metadata = {
  metadataBase,
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
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
          <AnalyticsProvider
            measurementId={GA_MEASUREMENT_ID}
            respectDNT={RESPECT_DNT}
            enabled={ANALYTICS_ENABLED}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
