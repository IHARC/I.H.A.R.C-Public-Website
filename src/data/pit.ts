import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { CACHE_TAGS } from '@/lib/cache/tags';
import {
  loadPitCountBySlug,
  loadPitPublicDataset,
  type PitBreakdownRow,
  type PitPublicDataset,
  type PitSummaryRow,
} from '@/lib/pit/public';

const PIT_REVALIDATE_SECONDS = 120;

const fetchPitDataset = unstable_cache(
  async (): Promise<PitPublicDataset> => {
    const supabase = await createSupabaseRSCClient();
    try {
      return await loadPitPublicDataset(supabase);
    } catch (error) {
      console.error('Failed to load point-in-time dataset', error);
      return { summaries: [], breakdowns: [] };
    }
  },
  ['marketing:pit:dataset'],
  {
    tags: [CACHE_TAGS.pitSummary],
    revalidate: PIT_REVALIDATE_SECONDS,
  },
);

const pitCountCache = new Map<
  string,
  () => Promise<{ summary: PitSummaryRow | null; breakdowns: PitBreakdownRow[] }>
>();

export async function getPitPublicDataset(): Promise<PitPublicDataset> {
  return fetchPitDataset();
}

export async function getPitCountBySlug(
  slug: string,
): Promise<{ summary: PitSummaryRow | null; breakdowns: PitBreakdownRow[] }> {
  let cached = pitCountCache.get(slug);

  if (!cached) {
    cached = unstable_cache(
      async () => {
        const supabase = await createSupabaseRSCClient();
        try {
          return await loadPitCountBySlug(supabase, slug);
        } catch (error) {
          console.error(`Failed to load point-in-time count for slug ${slug}`, error);
          return { summary: null, breakdowns: [] };
        }
      },
      ['marketing:pit:count', slug],
      {
        tags: [CACHE_TAGS.pitCount(slug)],
        revalidate: PIT_REVALIDATE_SECONDS,
      },
    );
    pitCountCache.set(slug, cached);
  }

  return cached();
}
