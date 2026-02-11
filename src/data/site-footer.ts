import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';

type SiteFooterContent = {
  primaryText: string;
  secondaryText: string | null;
};

const DEFAULT_SITE_FOOTER: SiteFooterContent = {
  primaryText: 'IHARC - Integrated Homelessness and Addictions Response Centre',
  secondaryText: 'Inclusive, accessible, community-first data platform.',
};

function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(error && error.code === 'PGRST205');
}

const fetchSiteFooter = unstable_cache(
  async (): Promise<SiteFooterContent> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('marketing_footer')
      .select('primary_text, secondary_text')
      .eq('id', true)
      .maybeSingle();

    if (error && !isMissingTableError(error)) {
      throw error;
    }

    if (!data || isMissingTableError(error)) {
      return DEFAULT_SITE_FOOTER;
    }

    return {
      primaryText: data.primary_text.trim(),
      secondaryText: data.secondary_text?.trim() || null,
    };
  },
  ['marketing:footer:public:v2'],
  {
    tags: [CACHE_TAGS.siteFooter],
    revalidate: 60,
  },
);

export async function getSiteFooterContent(): Promise<SiteFooterContent> {
  return fetchSiteFooter();
}
