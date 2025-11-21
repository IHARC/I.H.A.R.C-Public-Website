import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { CACHE_TAGS } from '@/lib/cache/tags';

type SiteFooterContent = {
  primaryText: string;
  secondaryText: string | null;
};

const DEFAULT_FOOTER: SiteFooterContent = {
  primaryText: 'IHARC — Integrated Homelessness and Addictions Response Centre.',
  secondaryText: 'Inclusive, accessible, community-first data platform.',
};

const fetchSiteFooter = unstable_cache(
  async (): Promise<SiteFooterContent> => {
    try {
      const supabase = await createSupabaseRSCClient();
      // core schema is shared but not yet reflected in generated types
      // @ts-expect-error core schema typings not generated yet
      const core = supabase.schema('core');

      const { data, error } = await core
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['marketing.footer.primary_text', 'marketing.footer.secondary_text']);

      if (error || !data) {
        if (error) {
          console.error('Failed to load site footer from Supabase', error);
        }
        return DEFAULT_FOOTER;
      }

      const primaryText =
        data.find((row) => row.setting_key === 'marketing.footer.primary_text')?.setting_value?.trim() ||
        DEFAULT_FOOTER.primaryText;
      const secondaryTextRaw =
        data.find((row) => row.setting_key === 'marketing.footer.secondary_text')?.setting_value?.trim() ?? null;

      return {
        primaryText,
        secondaryText: secondaryTextRaw && secondaryTextRaw.length ? secondaryTextRaw : null,
      };
    } catch (error) {
      console.error('Unable to query site footer content', error);
      return DEFAULT_FOOTER;
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
