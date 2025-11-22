export const CACHE_TAGS = {
  metrics: 'portal:metrics',
  mythEntries: 'marketing:myths',
  pitSummary: 'marketing:pit:summary',
  siteFooter: 'marketing:site-footer',
  policies: 'marketing:policies',
  donationCatalog: 'marketing:donation-catalog',
  pitCount(slug: string) {
    return `marketing:pit:count:${slug}`;
  },
} as const;
