import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { Database } from '@/types/supabase';

export type DonationCatalogItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  longDescription: string | null;
  category: string | null;
  unitCostCents: number | null;
  currency: string;
  defaultQuantity: number;
  priority: number;
  imageUrl: string | null;
  targetBuffer: number | null;
  currentStock: number | null;
  distributedLast30Days: number | null;
  distributedLast365Days: number | null;
};

const mapDonationRow = (row: Database['portal']['Views']['donation_catalog_public']['Row']): DonationCatalogItem => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  shortDescription: row.short_description ?? null,
  longDescription: row.long_description ?? null,
  category: row.category ?? null,
  unitCostCents: row.unit_cost_cents ?? null,
  currency: row.currency ?? 'CAD',
  defaultQuantity: row.default_quantity ?? 1,
  priority: row.priority ?? 100,
  imageUrl: row.image_url ?? null,
  targetBuffer: row.target_buffer ?? null,
  currentStock: row.current_stock ?? null,
  distributedLast30Days: row.distributed_last_30_days ?? null,
  distributedLast365Days: row.distributed_last_365_days ?? null,
});

const fetchCatalogCached = unstable_cache(
  async (): Promise<DonationCatalogItem[]> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('donation_catalog_public')
      .select('*')
      .order('priority', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapDonationRow);
  },
  ['donationCatalog'],
  { tags: [CACHE_TAGS.donationCatalog], revalidate: 900 },
);

export async function getDonationCatalog(): Promise<DonationCatalogItem[]> {
  return fetchCatalogCached();
}
