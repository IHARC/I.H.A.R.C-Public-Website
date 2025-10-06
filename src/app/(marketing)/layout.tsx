import type { ReactNode } from 'react';
import { EmergencyCallout } from '@/components/site/EmergencyCallout';
import { MarketingShell } from '@/components/shells/marketing-shell';
import { siteConfig } from '@/config/site';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const { emergency } = siteConfig;

  return (
    <MarketingShell>
      {emergency.enabled ? (
        <EmergencyCallout briefPath={emergency.briefPath} supportHref={emergency.supportHref} />
      ) : null}
      {children}
    </MarketingShell>
  );
}
