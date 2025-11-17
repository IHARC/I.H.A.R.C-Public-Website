'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type DashboardCardItem = {
  key: string;
  label: string;
  value: string | number;
  caption?: string;
  description?: string;
  trend?: 'up' | 'down' | 'flat';
};

export function DashboardCards({ items }: { items: DashboardCardItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.key} className="border border-outline/40 bg-surface shadow-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>{item.label}</span>
              {item.trend && <TrendIndicator trend={item.trend} />}
            </CardTitle>
            {item.caption && <p className="text-xs text-muted">{item.caption}</p>}
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-on-surface">{item.value}</p>
            {item.description && (
              <p className="mt-3 text-sm text-muted">{item.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const label = trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable';
  return (
    <span
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        trend === 'up' && 'bg-primary/10 text-primary',
        trend === 'down' && 'bg-inverse-surface/15 text-inverse-on-surface',
        trend === 'flat' && 'bg-surface-container-high text-on-surface/80',
      )}
    >
      {label}
    </span>
  );
}
