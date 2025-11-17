import type { MetadataRoute } from 'next';
import { fetchResourceLibrary } from '@/lib/resources';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharcc.ca';

const marketingPaths = [
  '/',
  '/about',
  '/programs',
  '/data',
  '/get-help',
  '/news',
  '/context',
  '/myth-busting',
  '/resources',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date().toISOString();

  const resources = await fetchResourceLibrary();

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

  return [...staticEntries, ...resourceEntries];
}
