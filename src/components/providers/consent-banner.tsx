'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import {
  dispatchConsentChanged,
  isDoNotTrackEnabled,
  readConsentState,
  writeConsentState,
  type ConsentState,
} from '@/lib/consent';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readConsentState();
    if (stored) {
      return;
    }

    if (isDoNotTrackEnabled()) {
      writeConsentState('denied');
      dispatchConsentChanged('denied');
      return;
    }

    setVisible(true);
  }, []);

  const handleChoice = useCallback((state: ConsentState) => {
    writeConsentState(state);
    dispatchConsentChanged(state);

    if (state === 'granted') {
      trackEvent('consent_preference_saved', { state });
    }

    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-30">
      <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[1.75rem] border border-outline/18 bg-surface/96 px-4 py-4 text-sm shadow-[0_20px_60px_rgba(17,12,16,0.18)] backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
        <div className="text-on-surface md:max-w-2xl">
          <p className="font-medium tracking-[-0.01em]">Cookies that strengthen community care</p>
          <p className="mt-1 text-muted-foreground">
            We use privacy-aware analytics to learn where neighbours need more support. Approving cookies helps us
            improve shared solutions faster.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChoice('denied')}
            data-testid="consent-decline"
            className="min-h-11 w-full sm:w-auto"
          >
            No, prefer fewer cookies
          </Button>
          <Button
            size="sm"
            onClick={() => handleChoice('granted')}
            data-testid="consent-accept"
            className="min-h-11 w-full sm:w-auto"
          >
            Yes, support IHARC insights
          </Button>
        </div>
      </div>
    </div>
  );
}
