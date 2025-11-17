export type TelemetryPayload = Record<string, unknown>;

type TelemetryWindow = Window & { dataLayer?: unknown[] };

export function trackClientEvent(event: string, payload: TelemetryPayload = {}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const telemetryWindow = window as TelemetryWindow;

  try {
    if (!Array.isArray(telemetryWindow.dataLayer)) {
      telemetryWindow.dataLayer = [];
    }
    telemetryWindow.dataLayer.push({ event, ...payload });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Telemetry dataLayer push skipped', error);
    }
  }

  // Network telemetry was only needed for the retired portal. Marketing pages rely on analytics scripts instead.
}
