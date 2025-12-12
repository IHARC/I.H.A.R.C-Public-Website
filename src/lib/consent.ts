export type ConsentState = 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'iharc-consent-preference';
export const CONSENT_CHANGED_EVENT = 'iharc-consent-changed';

export function readConsentState(): ConsentState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function writeConsentState(state: ConsentState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Ignore storage errors (e.g., private browsing)
  }
}

export function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const raw =
    window.navigator.doNotTrack ??
    (window as unknown as { doNotTrack?: string | number | null }).doNotTrack ??
    (window.navigator as unknown as { msDoNotTrack?: string | number | null }).msDoNotTrack;

  return raw === '1' || raw === 1 || raw === 'yes';
}

export function dispatchConsentChanged(state: ConsentState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: state }));
}

export function analyticsAllowedByConsent(): boolean {
  return readConsentState() === 'granted' && !isDoNotTrackEnabled();
}

