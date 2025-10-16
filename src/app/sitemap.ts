import type { MetadataRoute } from 'next';
import { resources } from '@/data/resources';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharcc.ca';

const marketingPaths = [
  '/',
  '/about',
  '/programs',
  '/data',
  '/get-help',
  '/news',
  '/petition',
  '/context',
  '/emergency',
  '/after-the-declaration',
  '/myth-busting',
  '/resources',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date().toISOString();

  const staticEntries = marketingPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: generatedAt,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.6,
  }));

  const resourceEntries = resources.map((resource) => ({
    url: `${SITE_URL}/resources/${resource.slug}`,
    lastModified: resource.datePublished,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...resourceEntries];
}
