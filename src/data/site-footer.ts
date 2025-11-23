import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';

type SiteFooterContent = {
  primaryText: string;
  secondaryText: string | null;
};

const PRIMARY_KEY = 'marketing.footer.primary_text';
const SECONDARY_KEY = 'marketing.footer.secondary_text';

const fetchSiteFooter = unstable_cache(
  async (): Promise<SiteFooterContent> => {
    try {
      const supabase = getSupabasePublicClient();
      const portal = supabase.schema('portal');

      const { data, error } = await portal
        .from('public_settings')
        .select('setting_key, setting_value')
        .eq('is_public', true)
        .in('setting_key', [PRIMARY_KEY, SECONDARY_KEY]);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No footer settings returned from Supabase');
      }

      const primaryText =
        data.find((row) => row.setting_key === PRIMARY_KEY)?.setting_value?.trim() ?? '';
      const secondaryTextRaw =
        data.find((row) => row.setting_key === SECONDARY_KEY)?.setting_value?.trim() ?? null;

      return {
        primaryText,
        secondaryText: secondaryTextRaw && secondaryTextRaw.length ? secondaryTextRaw : null,
      };
    } catch (error) {
      console.error('Unable to query site footer content', error);
      return { primaryText: '', secondaryText: null };
    }
  },
  ['marketing:footer:public'],
  {
    tags: [CACHE_TAGS.siteFooter],
    revalidate: 60,
  },
);

export async function getSiteFooterContent(): Promise<SiteFooterContent> {
  return fetchSiteFooter();
}
