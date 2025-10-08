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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const [canTrack, setCanTrack] = useState(false);

  useEffect(() => {
    if (!enabled || !measurementId) {
      setCanTrack(false);
      return;
    }

    if (respectDNT && isDoNotTrackEnabled()) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[analytics] Do Not Track enabled; scripts not loaded');
      }
      setCanTrack(false);
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

    const location = window.location.href;
    const pagePath = search ? `${pathname}?${search}` : pathname ?? '/';

    trackEvent('page_view', {
      page_location: location,
      page_path: pagePath,
      page_title: document.title,
    });
  }, [canTrack, measurementId, pathname, search]);

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
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}

