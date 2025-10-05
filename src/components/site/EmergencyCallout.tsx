'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

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
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">State of Emergency Declaration</p>
          <p className="mt-1 text-sm">
            Partners have issued a local declaration to keep neighbours safe. Review the brief and share your support in the collaboration portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link
            href={briefPath}
            className="rounded-full bg-amber-700 px-4 py-2 text-white shadow transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
            onClick={() => trackEvent('se_banner_click', { cta: 'read' })}
          >
            Read the brief
          </Link>
          <Link
            href={supportHref}
            className="rounded-full border border-amber-400 px-4 py-2 text-amber-900 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
            onClick={() => trackEvent('se_banner_click', { cta: 'support' })}
          >
            Support the declaration
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-auto inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
            aria-label="Dismiss emergency banner"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
