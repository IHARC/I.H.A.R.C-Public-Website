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
