import type { MetadataRoute } from 'next';
import { fetchResourceLibrary } from '@/lib/resources';
import { fetchPublishedPolicies } from '@/data/policies';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

const marketingPaths = [
  '/',
  '/about',
  '/programs',
  '/data',
  '/transparency',
  '/policies',
  '/get-help',
  '/news',
  '/context',
  '/myth-busting',
  '/resources',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date().toISOString();

  const resources = await fetchResourceLibrary();
  const policies = await fetchPublishedPolicies();

  const staticEntries = marketingPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: generatedAt,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.6,
  }));

  const resourceEntries = resources.map((resource) => ({
    url: `${SITE_URL}/resources/${resource.slug}`,
    lastModified: resource.updatedAt ?? resource.datePublished,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const policyEntries = policies.map((policy) => ({
    url: `${SITE_URL}/policies/${policy.slug}`,
    lastModified: policy.updatedAt ?? policy.lastReviewedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...resourceEntries, ...policyEntries];
}
