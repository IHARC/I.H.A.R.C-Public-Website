import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { CACHE_TAGS } from '@/lib/cache/tags';

type NavItem = {
  label: string;
  href: string;
};

type CtaLink = {
  label: string;
  href: string;
  analytics?: Record<string, unknown> | null;
};

export type HeroContent = {
  pill: string;
  headline: string;
  body: string;
  supporting: string;
  primaryCta: CtaLink;
  secondaryLink: CtaLink | null;
};

export type ContextCard = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type SupportContact = {
  label: string;
  href: string | null;
};

export type SupportEntry = {
  title: string;
  summary: string;
  body: string;
  contacts: SupportContact[];
};

export type ProgramEntry = {
  title: string;
  description: string;
};

type SettingsKey =
  | 'marketing.nav.items'
  | 'marketing.nav.portal_cta_label'
  | 'marketing.hero'
  | 'marketing.home.context_cards'
  | 'marketing.supports.urgent'
  | 'marketing.supports.mutual_aid'
  | 'marketing.programs';

type SettingsRow = { setting_key: string; setting_value: string | null };

const SETTING_KEYS: SettingsKey[] = [
  'marketing.nav.items',
  'marketing.nav.portal_cta_label',
  'marketing.hero',
  'marketing.home.context_cards',
  'marketing.supports.urgent',
  'marketing.supports.mutual_aid',
  'marketing.programs',
];

const fetchSettings = unstable_cache(
  async (): Promise<Record<SettingsKey, string | null>> => {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('public_settings')
      .select('setting_key, setting_value')
      .in('setting_key', SETTING_KEYS);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as SettingsRow[];
    const map = SETTING_KEYS.reduce<Record<SettingsKey, string | null>>(
      (acc, key) => ({ ...acc, [key]: null }),
      {} as Record<SettingsKey, string | null>,
    );

    for (const row of rows) {
      if (SETTING_KEYS.includes(row.setting_key as SettingsKey)) {
        map[row.setting_key as SettingsKey] = row.setting_value;
      }
    }

    return map;
  },
  ['marketing:settings'],
  {
    tags: [
      CACHE_TAGS.marketingContent,
      CACHE_TAGS.navigation,
      CACHE_TAGS.hero,
      CACHE_TAGS.context,
      CACHE_TAGS.supports,
      CACHE_TAGS.programs,
    ],
    revalidate: 60,
  },
);

function parseJson<T>(raw: string | null, context: string): T {
  if (!raw) {
    throw new Error(`Missing required marketing setting: ${context}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Invalid JSON for marketing setting ${context}: ${String(error)}`);
  }
}

export async function getMarketingNavigation(): Promise<{
  items: NavItem[];
  portalCtaLabel: string;
}> {
  const settings = await fetchSettings();
  const items = parseJson<NavItem[]>(settings['marketing.nav.items'], 'marketing.nav.items');
  const portalCtaLabel = settings['marketing.nav.portal_cta_label'] ?? '';

  return { items, portalCtaLabel };
}

export async function getHeroContent(): Promise<HeroContent> {
  const settings = await fetchSettings();
  return parseJson<HeroContent>(settings['marketing.hero'], 'marketing.hero');
}

export async function getContextCards(): Promise<ContextCard[]> {
  const settings = await fetchSettings();
  return parseJson<ContextCard[]>(settings['marketing.home.context_cards'], 'marketing.home.context_cards');
}

export async function getSupportEntries(): Promise<{ urgent: SupportEntry[]; mutualAid: string[] }> {
  const settings = await fetchSettings();
  const urgent = parseJson<SupportEntry[]>(settings['marketing.supports.urgent'], 'marketing.supports.urgent');
  const mutualAid = parseJson<string[]>(settings['marketing.supports.mutual_aid'], 'marketing.supports.mutual_aid');
  return { urgent, mutualAid };
}

export async function getProgramEntries(): Promise<ProgramEntry[]> {
  const settings = await fetchSettings();
  return parseJson<ProgramEntry[]>(settings['marketing.programs'], 'marketing.programs');
}
