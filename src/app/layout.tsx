import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { getBrandingAssets } from '@/data/marketing-content';
import { getMarketingSocialImage } from '@/lib/site-metadata';
import '@/styles/main.css';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { ConsentBanner } from '@/components/providers/consent-banner';

const DEFAULT_APP_URL = 'https://iharc.ca';
function resolvePublicAppUrl() {
  const rawValue =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    DEFAULT_APP_URL;

  try {
    const parsed = new URL(rawValue);
    if (parsed.hostname.startsWith('stevi.') && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return DEFAULT_APP_URL;
    }
    return parsed.toString();
  } catch {
    return DEFAULT_APP_URL;
  }
}

const appUrl = resolvePublicAppUrl();
const metadataBase = (() => {
  try {
    return new URL(appUrl);
  } catch {
    return new URL(DEFAULT_APP_URL);
  }
})();

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
});

const DEFAULT_GA_MEASUREMENT_ID = 'G-5B08FDG9J6';
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_ID ?? process.env.PUBLIC_GA4_ID ?? DEFAULT_GA_MEASUREMENT_ID;
const ANALYTICS_DISABLED = (process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? 'false').toLowerCase() === 'true';
const ANALYTICS_ENABLED = Boolean(GA_MEASUREMENT_ID) && !ANALYTICS_DISABLED;

const SITE_TITLE = 'IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County';
const SITE_DESCRIPTION =
  'IHARC provides street outreach and service navigation across Northumberland County, sharing public data while STEVI gives clients and partners a secure place to coordinate care.';

export const viewport: Viewport = {
  themeColor: '#cf123f',
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Integrated Homelessness and Addictions Response Centre',
  url: appUrl,
  description: SITE_DESCRIPTION,
};

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_TITLE,
  url: appUrl,
  description: SITE_DESCRIPTION,
  publisher: {
    '@type': 'Organization',
    name: 'Integrated Homelessness and Addictions Response Centre',
    url: appUrl,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const [branding, socialImage] = await Promise.all([getBrandingAssets(), getMarketingSocialImage()]);
  const favicon = branding?.faviconUrl || '/favicon.svg';

  return {
    metadataBase,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: '/',
    },
    icons: {
      icon: favicon,
    },
    openGraph: {
      type: 'website',
      siteName: 'IHARC',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: socialImage.url,
          alt: socialImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [socialImage.url],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={cn(
          'min-h-screen bg-background text-on-background antialiased',
          manrope.variable,
          spaceGrotesk.variable,
          'font-sans'
        )}
      >
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Script
            id="iharc-organization-jsonld"
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
          />
          <Script
            id="iharc-website-jsonld"
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
          />
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
