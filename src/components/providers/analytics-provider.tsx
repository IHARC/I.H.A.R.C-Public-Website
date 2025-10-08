'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

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
  respectDNT = true,
  enabled = true,
}: AnalyticsProviderProps) {
  type AnalyticsWindow = Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __gaInitialized?: boolean;
  };

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const [canTrack, setCanTrack] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!enabled || !measurementId) {
      setCanTrack(false);
      setInitialized(false);
      return;
    }

    if (respectDNT && isDoNotTrackEnabled()) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[analytics] Do Not Track enabled; scripts not loaded');
      }
      setCanTrack(false);
      setInitialized(false);
      return;
    }

    setCanTrack(true);
  }, [enabled, measurementId, respectDNT]);

  useEffect(() => {
    if (!canTrack || !measurementId) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;

    if (analyticsWindow.__gaInitialized) {
      setInitialized(true);
      return;
    }

    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    if (typeof analyticsWindow.gtag !== 'function') {
      analyticsWindow.gtag = (...args: unknown[]) => {
        analyticsWindow.dataLayer?.push(args);
      };
    }

    analyticsWindow.gtag?.('js', new Date());
    analyticsWindow.gtag?.('config', measurementId, {
      anonymize_ip: true,
      send_page_view: false,
    });

    analyticsWindow.__gaInitialized = true;
    setInitialized(true);
  }, [canTrack, measurementId]);

  useEffect(() => {
    if (!canTrack || !measurementId || !initialized) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const location = window.location.href;
    const pagePath = search ? `${pathname}?${search}` : pathname ?? '/';

    trackEvent('page_view', {
      page_location: location,
      page_path: pagePath,
      page_title: document.title,
    });
  }, [canTrack, initialized, measurementId, pathname, search]);

  if (!canTrack || !measurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="ga4-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
