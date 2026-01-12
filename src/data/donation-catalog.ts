import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';

const DONATION_CATALOG_REVALIDATE_SECONDS = 60;

export type DonationCatalogItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  longDescription: string | null;
  category: string | null;
  categoryLabels: string[];
  categorySlugs: string[];
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

type DonationCatalogRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  category_labels: string[] | null;
  category_slugs: string[] | null;
  unit_cost_cents: number | null;
  currency: string | null;
  default_quantity: number | null;
  priority: number | null;
  image_url: string | null;
  target_buffer: number | null;
  current_stock: number | null;
  distributed_last_30_days: number | null;
  distributed_last_365_days: number | null;
};

type LooseQuery = {
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
};

type LooseSelect = {
  select: (columns: string) => LooseQuery;
};

type LooseSchema = {
  from: (table: string) => LooseSelect;
};

const mapDonationRow = (row: DonationCatalogRow): DonationCatalogItem => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  shortDescription: row.short_description ?? null,
  longDescription: row.long_description ?? null,
  category: row.category ?? null,
  categoryLabels: row.category_labels ?? [],
  categorySlugs: row.category_slugs ?? [],
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
    const portal = supabase.schema('portal') as unknown as LooseSchema;

    const query = portal
      .from('donation_catalog_public')
      .select('*')
      .order('priority', { ascending: true })
      .order('title', { ascending: true });

    const { data, error } = (await query as unknown) as {
      data: DonationCatalogRow[] | null;
      error: { message: string } | null;
    };

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as DonationCatalogRow[];
    return rows.map(mapDonationRow);
  },
  ['donationCatalog'],
  { tags: [CACHE_TAGS.donationCatalog], revalidate: DONATION_CATALOG_REVALIDATE_SECONDS },
);

export async function getDonationCatalog(): Promise<DonationCatalogItem[]> {
  return fetchCatalogCached();
}
