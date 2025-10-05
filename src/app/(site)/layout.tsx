import type { ReactNode } from 'react';
import { EmergencyCallout } from '@/components/site/EmergencyCallout';
import { siteConfig } from '@/config/site';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const { emergency } = siteConfig;

  return (
    <div className="flex min-h-full flex-col">
      {emergency.enabled ? (
        <EmergencyCallout briefPath={emergency.briefPath} supportHref={emergency.supportHref} />
      ) : null}
      <div className="flex-1">{children}</div>
    </div>
  );
}
