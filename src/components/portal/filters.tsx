'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Housing', 'Health', 'Policing', 'Community', 'Prevention', 'Other'] as const;
const STATUSES = ['new', 'under_review', 'in_progress', 'adopted', 'not_feasible', 'archived'] as const;

export function Filters() {
  const router = useRouter();
  const params = useSearchParams();
  const safeParams = useMemo(() => params ?? new URLSearchParams(), [params]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(safeParams.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      router.replace(`?${next.toString()}`);
    },
    [safeParams, router],
  );

  const category = params?.get('category') ?? '';
  const status = params?.get('status') ?? '';
  const sort = params?.get('sort') ?? 'active';
  const hasSortParam = params?.has('sort') ?? false;
  const hasFilters = Boolean(category || status || hasSortParam);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={category}
        onValueChange={(value) => updateParam('category', value || null)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All categories</SelectItem>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(value) => updateParam('status', value || null)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(value) => updateParam('sort', value)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Sort by latest activity</SelectItem>
          <SelectItem value="newest">Newest ideas</SelectItem>
          <SelectItem value="top">Top votes</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(`?`)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Reset filters
        </Button>
      )}
    </div>
  );
}
