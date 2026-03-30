import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './tags';

export async function invalidateMetricCaches() {
  await revalidateTag(CACHE_TAGS.metrics);
}

export async function invalidateMythCaches() {
  await revalidateTag(CACHE_TAGS.mythEntries);
}

export async function invalidatePitCaches(slug?: string) {
  const tags = new Set<string>([CACHE_TAGS.pitSummary]);

  if (slug) {
    tags.add(CACHE_TAGS.pitCount(slug));
  }

  for (const tag of tags) {
    await revalidateTag(tag);
  }
}

export async function invalidateSiteFooter() {
  await revalidateTag(CACHE_TAGS.siteFooter);
}

export async function invalidatePublicDocumentCaches() {
  await revalidateTag(CACHE_TAGS.publicDocuments);
}

export async function invalidateDonationCatalog() {
  await revalidateTag(CACHE_TAGS.donationCatalog);
}

export async function invalidateVolunteerRoleCaches() {
  await revalidateTag(CACHE_TAGS.volunteerRoles);
}

export async function invalidateMarketingContentCaches() {
  const tags = [
    CACHE_TAGS.marketingContent,
    CACHE_TAGS.navigation,
    CACHE_TAGS.hero,
    CACHE_TAGS.branding,
    CACHE_TAGS.context,
    CACHE_TAGS.supports,
    CACHE_TAGS.programs,
  ] as const;

  for (const tag of tags) {
    await revalidateTag(tag);
  }
}

export async function invalidateAllPublicSiteCaches() {
  await invalidateMarketingContentCaches();
  await invalidateMetricCaches();
  await invalidateMythCaches();
  await invalidatePitCaches();
  await invalidateSiteFooter();
  await invalidatePublicDocumentCaches();
  await invalidateDonationCatalog();
  await invalidateVolunteerRoleCaches();
}
