'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ResourceFilters, ResourceKind } from '@/lib/resources';

const ALL_VALUE = 'all';

export function ResourceFiltersControls({
  filters,
  kinds,
  tags,
  years,
}: {
  filters: ResourceFilters;
  kinds: { value: ResourceKind; label: string }[];
  tags: string[];
  years: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(filters.q ?? '');

  useEffect(() => {
    setQuery(filters.q ?? '');
  }, [filters.q]);

  const safeParams = useMemo(() => new URLSearchParams(searchParams?.toString()), [searchParams]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(safeParams.toString());
      if (value && value !== ALL_VALUE) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, safeParams],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateParam('q', query.trim() ? query.trim() : null);
    },
    [query, updateParam],
  );

  const handleReset = useCallback(() => {
    setQuery('');
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label htmlFor="resource-search" className="text-sm font-medium text-on-surface">
            Search resources
          </label>
          <div className="flex w-full flex-col gap-2 md:flex-1">
            <Input
              id="resource-search"
              placeholder="Search by title, tags, or location"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-describedby="resource-search-hint"
            />
            <p id="resource-search-hint" className="text-xs text-on-surface/60">
              Press enter to search by keywords across titles, locations, and tags.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.kind ?? ALL_VALUE}
              onValueChange={(value) => updateParam('kind', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All types</SelectItem>
                {kinds.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value}>
                    {kind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.tag ?? ALL_VALUE} onValueChange={(value) => updateParam('tag', value)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {formatTagLabel(tag)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.year ?? ALL_VALUE} onValueChange={(value) => updateParam('year', value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="secondary">
              Apply search
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              Reset filters
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function formatTagLabel(tag: string) {
  return tag
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
