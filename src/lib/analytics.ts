export function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const { doNotTrack } = navigator as Navigator & { doNotTrack?: string | null };
  if (doNotTrack === '1') return;
  // eslint-disable-next-line no-console
  console.log('trackEvent', name, data ?? {});
}
