import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import type { Database } from '@/types/supabase';
import { CACHE_TAGS } from '@/lib/cache/tags';

type MythEntryRow = Database['public']['Tables']['myth_busting_entries']['Row'];

const MYTH_REVALIDATE_SECONDS = 120;

const fetchPublishedMyths = unstable_cache(
  async (): Promise<MythEntryRow[]> => {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
      .from('myth_busting_entries')
      .select('id, slug, title, myth_statement, fact_statement, status, analysis, sources, tags, updated_at')
      .eq('is_published', true)
      .order('order_index', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load published myth busting entries', error);
      return [];
    }

    return (data ?? []) as MythEntryRow[];
  },
  ['marketing:myths:published'],
  {
    tags: [CACHE_TAGS.mythEntries],
    revalidate: MYTH_REVALIDATE_SECONDS,
  },
);

export async function getPublishedMythEntries(): Promise<MythEntryRow[]> {
  return fetchPublishedMyths();
}
