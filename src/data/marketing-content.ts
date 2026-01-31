import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
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
  imageUrl?: string | null;
  imageAlt?: string | null;
  primaryCta: CtaLink;
  secondaryLink: CtaLink | null;
};

export type BrandingAssets = {
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
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
  | 'marketing.branding'
  | 'marketing.hero'
  | 'marketing.home.context_cards'
  | 'marketing.supports.urgent'
  | 'marketing.supports.mutual_aid'
  | 'marketing.programs';

type SettingsRow = { setting_key: string; setting_value: string | null };

const SETTING_KEYS: SettingsKey[] = [
  'marketing.nav.items',
  'marketing.nav.portal_cta_label',
  'marketing.branding',
  'marketing.hero',
  'marketing.home.context_cards',
  'marketing.supports.urgent',
  'marketing.supports.mutual_aid',
  'marketing.programs',
];

const fetchSettings = unstable_cache(
  async (): Promise<Record<SettingsKey, string | null>> => {
    const supabase = getSupabasePublicClient();
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
      CACHE_TAGS.branding,
      CACHE_TAGS.context,
      CACHE_TAGS.supports,
      CACHE_TAGS.programs,
    ],
    revalidate: 60,
  },
);

const ALLOWED_URGENT_CONTACT_HREFS = new Set([
  'tel:211',
  'tel:9053769562',
  'tel:988',
  'tel:9053779891',
  'mailto:outreach@iharc.ca',
]);

const ALLOWED_URGENT_CONTACT_LABELS = [
  '211',
  '9053769562',
  '988',
  '9053779891',
  'outreach@iharc.ca',
  'raamclinictuesdays123pmat1011elginstw2ndfloor',
];

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

function normalizeContactHref(href: string): string {
  const trimmed = href.trim().toLowerCase();
  if (trimmed.startsWith('tel:')) {
    let digits = trimmed.replace(/^tel:/, '').replace(/[^0-9]/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    return `tel:${digits.replace(/^0+/, '')}`;
  }
  if (trimmed.startsWith('mailto:')) {
    const email = trimmed.replace(/^mailto:/, '').trim();
    return `mailto:${email}`;
  }
  return trimmed;
}

function normalizeContactLabel(label: string): string {
  return label.toLowerCase().replace(/[^0-9a-z@]/g, '');
}

export function assertUrgentSupportContacts(entries: SupportEntry[]): void {
  const invalidContacts: string[] = [];

  entries.forEach((entry) => {
    entry.contacts.forEach((contact) => {
      if (contact.href) {
        const normalized = normalizeContactHref(contact.href);
        if (!ALLOWED_URGENT_CONTACT_HREFS.has(normalized)) {
          invalidContacts.push(`${entry.title} -> ${contact.label} (${contact.href})`);
        }
        return;
      }

      const normalizedLabel = normalizeContactLabel(contact.label);
      const matches = ALLOWED_URGENT_CONTACT_LABELS.some((allowed) => normalizedLabel.includes(allowed));
      if (!matches) {
        invalidContacts.push(`${entry.title} -> ${contact.label}`);
      }
    });
  });

  if (invalidContacts.length) {
    throw new Error(`Unapproved urgent support contacts detected: ${invalidContacts.join('; ')}`);
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

export async function getBrandingAssets(): Promise<BrandingAssets | null> {
  const settings = await fetchSettings();
  const raw = settings['marketing.branding'];
  if (!raw) return null;
  return parseJson<BrandingAssets>(raw, 'marketing.branding');
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
  assertUrgentSupportContacts(urgent);
  return { urgent, mutualAid };
}

export async function getProgramEntries(): Promise<ProgramEntry[]> {
  const settings = await fetchSettings();
  return parseJson<ProgramEntry[]>(settings['marketing.programs'], 'marketing.programs');
}
