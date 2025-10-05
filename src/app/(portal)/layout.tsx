import type { ReactNode } from 'react';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="flex-1 bg-background">{children}</main>
      <SiteFooter />
    </div>
  );
}
