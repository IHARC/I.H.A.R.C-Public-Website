import type { ReactNode } from 'react';
import { MarketingShell } from '@/components/shells/marketing-shell';

export default function StatsLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
