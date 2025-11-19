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
      const portal = supabase.schema('portal');

      const { data, error } = await portal
        .from('site_footer_settings')
        .select('primary_text, secondary_text')
        .eq('slot', 'public_marketing')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          console.error('Failed to load site footer from Supabase', error);
        }
        return DEFAULT_FOOTER;
      }

      const primaryText = data.primary_text?.trim() || DEFAULT_FOOTER.primaryText;
      const secondaryTextRaw = data.secondary_text?.trim() ?? null;

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
