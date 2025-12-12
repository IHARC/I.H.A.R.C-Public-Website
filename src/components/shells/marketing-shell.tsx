import type { ReactNode } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { SiteFooter } from '@/components/SiteFooter';

export function MarketingShell({ children }: { children: ReactNode }) {
  const showDevNotice = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      {showDevNotice ? (
        <div className="w-full bg-amber-100 px-4 py-2 text-sm text-amber-900 shadow-sm">
          <p className="mx-auto max-w-7xl text-center">
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
