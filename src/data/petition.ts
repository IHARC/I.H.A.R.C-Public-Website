import { unstable_cache } from 'next/cache';
import type { Database } from '@/types/supabase';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';

type PetitionSummaryRow = Database['portal']['Views']['petition_public_summary']['Row'];
type PetitionSignerRow = Database['portal']['Views']['petition_public_signers']['Row'];

const PETITION_REVALIDATE_SECONDS = 120;

const petitionSummaryCache = new Map<string, () => Promise<PetitionSummaryRow | null>>();

export async function getPetitionPublicSummary(slug: string): Promise<PetitionSummaryRow | null> {
  let cached = petitionSummaryCache.get(slug);
  if (!cached) {
    cached = unstable_cache(
      async () => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

        const { data, error } = await portal
          .from('petition_public_summary')
          .select('*')
          .eq('slug', slug)
          .maybeSingle<PetitionSummaryRow>();

        if (error) {
          console.error(`Failed to load petition summary for slug ${slug}`, error);
          return null;
        }

        return data ?? null;
      },
      ['marketing:petition:summary', slug],
      {
        tags: [CACHE_TAGS.petition(slug)],
        revalidate: PETITION_REVALIDATE_SECONDS,
      },
    );
    petitionSummaryCache.set(slug, cached);
  }

  return cached();
}

type PetitionSignersParams = {
  petitionId: string;
  slug: string;
  from: number;
  to: number;
};

const petitionSignersCache = new Map<
  string,
  () => Promise<{ signers: PetitionSignerRow[]; total: number }>
>();

export async function getPetitionSigners({
  petitionId,
  slug,
  from,
  to,
}: PetitionSignersParams): Promise<{ signers: PetitionSignerRow[]; total: number }> {
  const key = `${slug}:${petitionId}:${from}:${to}`;
  let cached = petitionSignersCache.get(key);

  if (!cached) {
    cached = unstable_cache(
      async () => {
        const supabase = getSupabasePublicClient();
        const portal = supabase.schema('portal');

        const { data, count, error } = await portal
          .from('petition_public_signers')
          .select('display_name, created_at, display_preference', { count: 'exact' })
          .eq('petition_id', petitionId)
          .order('created_at', { ascending: false })
          .range(from, to)
          .returns<PetitionSignerRow[]>();

        if (error) {
          console.error(
            `Failed to load petition signers for slug ${slug} (range ${from}-${to})`,
            error,
          );
          return { signers: [], total: 0 };
        }

        return {
          signers: data ?? [],
          total: count ?? 0,
        };
      },
      ['marketing:petition:signers', key],
      {
        tags: [CACHE_TAGS.petitionSigners(slug)],
        revalidate: PETITION_REVALIDATE_SECONDS,
      },
    );
    petitionSignersCache.set(key, cached);
  }

  return cached();
}
