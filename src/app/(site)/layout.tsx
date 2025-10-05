import type { ReactNode } from 'react';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { EmergencyCallout } from '@/components/site/EmergencyCallout';
import { siteConfig } from '@/config/site';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const { emergency } = siteConfig;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      {emergency.enabled ? (
        <EmergencyCallout briefPath={emergency.briefPath} supportHref={emergency.supportHref} />
      ) : null}
      <main className="flex-1 bg-background">{children}</main>
      <SiteFooter />
    </div>
  );
}
