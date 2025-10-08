'use client';

import { useEffect, useMemo, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/telemetry';

type AnalyticsProviderProps = {
  measurementId?: string | null;
  enabled?: boolean;
};

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function AnalyticsProvider({ measurementId, enabled = true }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !measurementId || typeof window === 'undefined') {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    analyticsWindow.gtag =
      analyticsWindow.gtag ??
      function gtag(...args: unknown[]) {
        analyticsWindow.dataLayer?.push(args);
      };

    const pagePath = search ? `${pathname}?${search}` : pathname ?? '/';

    if (lastTrackedPathRef.current === pagePath) {
      return;
    }

    const pageLocation = window.location.href;
    const pageTitle = document.title;
    const payload = {
      page_location: pageLocation,
      page_path: pagePath,
      page_title: pageTitle,
    };

    if (lastTrackedPathRef.current === null) {
      lastTrackedPathRef.current = pagePath;
      trackClientEvent('page_view', payload);
      return;
    }

    lastTrackedPathRef.current = pagePath;

    analyticsWindow.gtag('config', measurementId, {
      page_path: pagePath,
      page_location: pageLocation,
      page_title: pageTitle,
    });

    trackClientEvent('page_view', payload);
  }, [enabled, measurementId, pathname, search]);

  if (!enabled || !measurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="ga4-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-inline"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var measurementId = ${JSON.stringify(measurementId)};
              var consentKey = 'iharc-consent-preference';
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;

              var consentDefaults = {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
              };

              try {
                var storedConsent = window.localStorage.getItem(consentKey);
                if (storedConsent === 'granted') {
                  consentDefaults = {
                    ad_storage: 'granted',
                    analytics_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                  };
                } else if (storedConsent === 'denied') {
                  consentDefaults = {
                    ad_storage: 'denied',
                    analytics_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                  };
                }
              } catch (error) {
                // Ignore storage access issues
              }

              gtag('consent', 'default', consentDefaults);
              gtag('js', new Date());
              gtag('config', measurementId, { anonymize_ip: true });
            })();
          `,
        }}
      />
    </>
  );
}
