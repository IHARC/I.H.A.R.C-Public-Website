'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/telemetry';

type AnalyticsProviderProps = {
  measurementId?: string | null;
  respectDNT?: boolean;
  enabled?: boolean;
};

function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined' && typeof window === 'undefined') {
    return false;
  }

  const nav = typeof navigator === 'undefined' ? ({} as Navigator) : navigator;
  const win = typeof window === 'undefined' ? ({} as Window & { doNotTrack?: string | null }) : window;

  const dnt = (nav as Navigator & { doNotTrack?: string | null; msDoNotTrack?: string | null }).doNotTrack
    ?? (nav as Navigator & { doNotTrack?: string | null; msDoNotTrack?: string | null }).msDoNotTrack
    ?? (win as Window & { doNotTrack?: string | null }).doNotTrack;

  return dnt === '1' || dnt === 'yes';
}

export function AnalyticsProvider({
  measurementId,
  respectDNT = false,
  enabled = true,
}: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const [trackingAllowed, setTrackingAllowed] = useState(false);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !measurementId) {
      setTrackingAllowed(false);
      return;
    }

    if (respectDNT && isDoNotTrackEnabled()) {
      setTrackingAllowed(false);
      return;
    }

    setTrackingAllowed(true);
  }, [enabled, measurementId, respectDNT]);

  useEffect(() => {
    if (!trackingAllowed || !measurementId || typeof window === 'undefined') {
      return;
    }

    const pagePath = search ? `${pathname}?${search}` : pathname ?? '/';

    if (lastTrackedPathRef.current === pagePath) {
      return;
    }

    lastTrackedPathRef.current = pagePath;
    const pageLocation = window.location.href;
    const pageTitle = document.title;

    const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;

    const payload = {
      page_location: pageLocation,
      page_path: pagePath,
      page_title: pageTitle,
    };

    gtag?.('event', 'page_view', {
      page_location: pageLocation,
      page_path: pagePath,
      page_title: pageTitle,
      send_to: measurementId,
    });

    trackClientEvent('page_view', payload);
  }, [trackingAllowed, measurementId, pathname, search]);

  if (!trackingAllowed || !measurementId) {
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
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(measurementId)}, { anonymize_ip: true, send_page_view: false });
          `,
        }}
      />
    </>
  );
}
