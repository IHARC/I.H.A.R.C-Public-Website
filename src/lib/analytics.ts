import { trackClientEvent } from './telemetry';

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const isTrue = (value: string | undefined | null) => value?.toLowerCase() === 'true';

const ENABLE_IN_DEV = isTrue(
  process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS_IN_DEV ?? process.env.PUBLIC_ENABLE_INTEGRATIONS_IN_DEV,
);
const RESPECT_DNT = (process.env.NEXT_PUBLIC_ANALYTICS_RESPECT_DNT ?? 'true').toLowerCase() !== 'false';
const ANALYTICS_DISABLED = isTrue(process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? 'false');
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? process.env.PUBLIC_GA4_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? process.env.PUBLIC_GTM_ID;

export function trackEvent(name: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (ANALYTICS_DISABLED) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics] Tracking disabled; event skipped', name, data);
    }
    return;
  }

  const analyticsWindow = window as AnalyticsWindow;

  if (RESPECT_DNT) {
    const doNotTrack = (navigator as Navigator & { doNotTrack?: string | null }).doNotTrack;
    if (doNotTrack === '1' || doNotTrack === 'yes') {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[analytics] Do Not Track enabled; event skipped', name);
      }
      return;
    }
  }

  if (process.env.NODE_ENV === 'development' && !ENABLE_IN_DEV) {
    console.debug('[analytics]', name, data);
    return;
  }

  const payload = { ...data, event: name, timestamp: Date.now() };

  if (!Array.isArray(analyticsWindow.dataLayer)) {
    analyticsWindow.dataLayer = [];
  }

  analyticsWindow.dataLayer.push(payload);

  if (GA4_ID && typeof analyticsWindow.gtag === 'function') {
    analyticsWindow.gtag('event', name, data);
  }

  if (GTM_ID && typeof analyticsWindow.dataLayer !== 'undefined') {
    // Google Tag Manager listens on the same dataLayer; the push above is sufficient.
  }

  if (typeof analyticsWindow.fbq === 'function') {
    analyticsWindow.fbq('trackCustom', name, data);
  }

  trackClientEvent(name, data);
}
