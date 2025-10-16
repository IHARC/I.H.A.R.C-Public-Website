'use client';

import { useEffect } from 'react';
import type { Resource, ResourceFilters } from '@/lib/resources';
import { trackEvent } from '@/lib/analytics';

export function ResourceIndexAnalytics({
  total,
  filters,
}: {
  total: number;
  filters: ResourceFilters;
}) {
  useEffect(() => {
    trackEvent('resource_index_view', {
      total,
      hasQuery: Boolean(filters.q),
      kind: filters.kind ?? 'all',
      tag: filters.tag ?? 'all',
      year: filters.year ?? 'all',
    });
  }, [filters.kind, filters.q, filters.tag, filters.year, total]);

  return null;
}

export function ResourceDetailAnalytics({ resource }: { resource: Resource }) {
  useEffect(() => {
    trackEvent('resource_detail_view', {
      slug: resource.slug,
      kind: resource.kind,
    });
  }, [resource.slug, resource.kind]);

  return null;
}
