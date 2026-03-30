import type { ReactNode } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { SiteFooter } from '@/components/SiteFooter';

export function MarketingShell({ children }: { children: ReactNode }) {
  const showDevNotice = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      {showDevNotice ? (
        <div className="w-full border-b border-amber-200 bg-amber-50/90 px-4 py-1.5 text-xs text-amber-900">
          <p className="mx-auto max-w-7xl text-center tracking-[0.02em]">
            This site is under active development. You may encounter bugs or outdated copy while we finish updates.
          </p>
        </div>
      ) : null}
      <TopNav />
      <main id="main-content" className="flex-1 bg-background">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
