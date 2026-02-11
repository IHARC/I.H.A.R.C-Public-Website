import type { MetadataRoute } from 'next';
import { fetchResourceLibrary } from '@/lib/resources';
import { fetchPublishedPolicies } from '@/data/policies';
import { fetchVolunteerRoles } from '@/data/volunteers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

const marketingPaths = [
  '/',
  '/about',
  '/programs',
  '/data',
  '/transparency',
  '/transparency/policies',
  '/get-help',
  '/updates',
  '/context',
  '/myth-busting',
  '/resources',
  '/volunteer',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date().toISOString();

  const [resources, policies, volunteerRoles] = await Promise.all([
    fetchResourceLibrary(),
    fetchPublishedPolicies(),
    fetchVolunteerRoles(),
  ]);

  const staticEntries = marketingPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: generatedAt,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.6,
  }));

  const resourceEntries = resources.map((resource) => {
    const path =
      resource.contentChannel === 'updates'
        ? `/updates/${resource.slug}`
        : resource.contentChannel === 'transparency'
          ? `/transparency/resources/${resource.slug}`
          : `/resources/${resource.slug}`;

    return {
      url: `${SITE_URL}${path}`,
      lastModified: resource.updatedAt ?? resource.datePublished,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    };
  });

  const policyEntries = policies.map((policy) => ({
    url: `${SITE_URL}/transparency/policies/${policy.slug}`,
    lastModified: policy.updatedAt ?? policy.lastReviewedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const volunteerEntries = volunteerRoles.map((role) => ({
    url: `${SITE_URL}/volunteer/${role.slug}`,
    lastModified: role.updatedAt ?? role.publishedAt ?? generatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...resourceEntries, ...policyEntries, ...volunteerEntries];
}
