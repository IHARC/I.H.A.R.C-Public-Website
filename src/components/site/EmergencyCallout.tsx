'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { SupportDeclarationLink } from '@/components/site/support-declaration-link';

const STORAGE_KEY = 'iharc.se.dismissed';

type EmergencyCalloutProps = {
  briefPath: string;
  supportHref: string;
};

export function EmergencyCallout({ briefPath, supportHref }: EmergencyCalloutProps) {
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setIsDismissed(stored === 'true');
  }, []);

  if (isDismissed === null) {
    return null;
  }

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
    trackEvent('se_banner_dismiss');
  };

  return (
    <div className="border-b border-primary/30 bg-primary-container text-on-primary-container">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide">State of Emergency Declaration</p>
          <p className="text-sm">
            IHARC has urged Cobourg to declare a <strong>State of Emergency</strong> to coordinate housing and overdose response.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <SupportDeclarationLink
            href={supportHref}
            source="banner"
            className="rounded-full bg-primary px-4 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container"
          >
            Support the declaration
          </SupportDeclarationLink>
          <Link
            href={briefPath}
            className="inline-flex items-center gap-1 text-on-primary-container underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container"
            onClick={() => trackEvent('se_banner_click', { cta: 'learn' })}
          >
            Learn why
            <span aria-hidden>→</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-auto inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide text-on-primary-container/80 transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container"
            aria-label="Dismiss emergency banner"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
