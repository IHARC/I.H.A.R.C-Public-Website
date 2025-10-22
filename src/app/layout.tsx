import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Roboto, Roboto_Flex } from 'next/font/google';
import { cn } from '@/lib/utils';
import '@/styles/main.css';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { ConsentBanner } from '@/components/providers/consent-banner';

const DEFAULT_APP_URL = 'https://iharc.ca';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_APP_URL;
const metadataBase = (() => {
  try {
    return new URL(appUrl);
  } catch {
    return new URL(DEFAULT_APP_URL);
  }
})();

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
});
const robotoFlex = Roboto_Flex({ subsets: ['latin'], variable: '--font-heading' });

const DEFAULT_GA_MEASUREMENT_ID = 'G-5B08FDG9J6';
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_ID ?? process.env.PUBLIC_GA4_ID ?? DEFAULT_GA_MEASUREMENT_ID;
const ANALYTICS_DISABLED = (process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? 'false').toLowerCase() === 'true';
const ANALYTICS_ENABLED = Boolean(GA_MEASUREMENT_ID) && !ANALYTICS_DISABLED;
const OG_IMAGE_PATH = '/logo.png';
const OG_IMAGE_ALT = 'IHARC — Integrated Homelessness and Addictions Response Centre';

export const metadata: Metadata = {
  metadataBase,
  title: 'IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County',
  description:
    'IHARC coordinates housing stability and overdose response with neighbours, agencies, and local government in Northumberland County. Co-design plans, track data, get help.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'IHARC',
    title: 'IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County',
    description:
      'IHARC coordinates housing stability and overdose response with neighbours, agencies, and local government in Northumberland County. Co-design plans, track data, get help.',
    images: [
      {
        url: OG_IMAGE_PATH,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County',
    description:
      'IHARC coordinates housing stability and overdose response with neighbours, agencies, and local government in Northumberland County. Co-design plans, track data, get help.',
    images: [OG_IMAGE_PATH],
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
          <Suspense fallback={null}>
            <AnalyticsProvider
              measurementId={GA_MEASUREMENT_ID}
              enabled={ANALYTICS_ENABLED}
            />
          </Suspense>
          <ConsentBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
