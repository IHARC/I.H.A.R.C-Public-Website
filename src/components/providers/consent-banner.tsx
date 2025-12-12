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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-outline bg-surface shadow-lg">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="text-on-surface md:max-w-xl">
          <p className="font-medium">Cookies that strengthen community care</p>
          <p className="mt-1 text-muted-foreground">
            We use privacy-aware analytics to learn where neighbours need more support. Approving cookies helps us
            improve shared solutions faster.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChoice('denied')}
            data-testid="consent-decline"
            className="w-full sm:w-auto"
          >
            No, prefer fewer cookies
          </Button>
          <Button
            size="sm"
            onClick={() => handleChoice('granted')}
            data-testid="consent-accept"
            className="w-full sm:w-auto"
          >
            Yes, support IHARC insights
          </Button>
        </div>
      </div>
    </div>
  );
}
