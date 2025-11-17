export const CACHE_TAGS = {
  metrics: 'portal:metrics',
  mythEntries: 'marketing:myths',
  pitSummary: 'marketing:pit:summary',
  pitCount(slug: string) {
    return `marketing:pit:count:${slug}`;
  },
} as const;
