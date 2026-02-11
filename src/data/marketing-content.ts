import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { Database } from '@/types/supabase';

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

type MarketingRows = {
  branding: Database['portal']['Tables']['marketing_branding']['Row'] | null;
  navigation: Database['portal']['Tables']['marketing_navigation']['Row'] | null;
  home: Database['portal']['Tables']['marketing_home']['Row'] | null;
  supports: Database['portal']['Tables']['marketing_supports']['Row'] | null;
  programs: Database['portal']['Tables']['marketing_programs']['Row'] | null;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Context', href: '/context' },
  { label: 'Myth Busting', href: '/myth-busting' },
  { label: 'Updates', href: '/updates' },
  { label: 'Get Help', href: '/get-help' },
  { label: 'Programs', href: '/programs' },
  { label: 'Resources', href: '/resources' },
  { label: 'Community Status', href: '/stats' },
  { label: 'Data', href: '/data' },
  { label: 'Transparency', href: '/transparency' },
  { label: 'Donate', href: '/donate' },
];

const DEFAULT_HERO_CONTENT: HeroContent = {
  pill: 'Northumberland County',
  headline: 'Coordinating housing and health supports in the open',
  body: 'IHARC brings neighbours, service providers, and local government together around one response model.',
  supporting: 'Use this public site for updates and transparency. STEVI is the secure portal for clients and outreach teams.',
  imageUrl: '/heroes/hero-main.jpg',
  imageAlt: 'IHARC outreach workers coordinating supports in Northumberland County',
  primaryCta: {
    label: 'Get help',
    href: '/get-help',
  },
  secondaryLink: {
    label: 'Read updates',
    href: '/updates',
  },
};

const DEFAULT_CONTEXT_CARDS: ContextCard[] = [
  {
    id: 'local-context',
    title: 'Local context',
    description: 'How housing pressure, poverty, and health needs intersect across Northumberland County.',
    href: '/context',
  },
  {
    id: 'community-status',
    title: 'Community status',
    description: 'Track real-time indicators tied to outreach, emergency response, and housing flow.',
    href: '/stats',
  },
  {
    id: 'transparency',
    title: 'Transparency hub',
    description: 'Review SOPs, policies, and accountability resources published by IHARC.',
    href: '/transparency',
  },
];

const DEFAULT_SUPPORT_ENTRIES: SupportEntry[] = [
  {
    title: 'Immediate support',
    summary: 'Call for urgent guidance and local service navigation.',
    body: 'In an emergency call 911.',
    contacts: [
      { label: '211', href: 'tel:211' },
      { label: '988', href: 'tel:988' },
    ],
  },
  {
    title: 'Coordinated entry',
    summary: 'Transition House coordinated entry line.',
    body: 'In an emergency call 911.',
    contacts: [{ label: '905-376-9562', href: 'tel:9053769562' }],
  },
  {
    title: 'Outreach and mental health supports',
    summary: 'IHARC outreach and NHH Community Mental Health Services.',
    body: 'In an emergency call 911.',
    contacts: [
      { label: 'outreach@iharc.ca', href: 'mailto:outreach@iharc.ca' },
      { label: '905-377-9891', href: 'tel:9053779891' },
    ],
  },
];

const DEFAULT_MUTUAL_AID: string[] = [
  'Carry naloxone where possible.',
  'The Good Samaritan Drug Overdose Act protects people seeking emergency help.',
  'RAAM clinic: Tuesdays 1-3 PM at 1011 Elgin St W, 2nd floor.',
];

const DEFAULT_PROGRAMS: ProgramEntry[] = [
  {
    title: 'Street outreach',
    description: 'On-the-ground connection to shelter, overdose response, and care coordination.',
  },
  {
    title: 'System coordination',
    description: 'Cross-agency coordination to reduce service gaps and duplication.',
  },
  {
    title: 'Transparency and public reporting',
    description: 'Ongoing publication of policies, SOPs, and community status indicators.',
  },
];

function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(error && error.code === 'PGRST205');
}

const fetchMarketingRows = unstable_cache(
  async (): Promise<MarketingRows> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const [branding, navigation, home, supports, programs] = await Promise.all([
      portal.from('marketing_branding').select('*').eq('id', true).maybeSingle(),
      portal.from('marketing_navigation').select('*').eq('id', true).maybeSingle(),
      portal.from('marketing_home').select('*').eq('id', true).maybeSingle(),
      portal.from('marketing_supports').select('*').eq('id', true).maybeSingle(),
      portal.from('marketing_programs').select('*').eq('id', true).maybeSingle(),
    ]);

    const responses = [branding, navigation, home, supports, programs];
    const blockingError = responses.find((response) => response.error && !isMissingTableError(response.error));
    if (blockingError?.error) {
      throw blockingError.error;
    }

    return {
      branding: branding.error ? null : branding.data,
      navigation: navigation.error ? null : navigation.data,
      home: home.error ? null : home.data,
      supports: supports.error ? null : supports.data,
      programs: programs.error ? null : programs.data,
    };
  },
  ['marketing:tables:v1'],
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

function parseJsonField<T>(value: unknown, context: string): T {
  if (value == null) {
    throw new Error(`Missing required marketing setting: ${context}`);
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      throw new Error(`Invalid JSON for marketing setting ${context}: ${String(error)}`);
    }
  }

  return value as T;
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
  const rows = await fetchMarketingRows();
  const items = rows.navigation?.items
    ? parseJsonField<NavItem[]>(rows.navigation.items, 'marketing_navigation.items')
    : DEFAULT_NAV_ITEMS;
  const portalCtaLabel = rows.navigation?.portal_cta_label ?? 'Access S.T.E.V.I.';

  return { items, portalCtaLabel };
}

export async function getBrandingAssets(): Promise<BrandingAssets | null> {
  const rows = await fetchMarketingRows();
  const branding = rows.branding;
  if (!branding) return null;

  return {
    logoLightUrl: branding.logo_light_url,
    logoDarkUrl: branding.logo_dark_url,
    faviconUrl: branding.favicon_url,
  };
}

export async function getHeroContent(): Promise<HeroContent> {
  const rows = await fetchMarketingRows();
  if (!rows.home?.hero) {
    return DEFAULT_HERO_CONTENT;
  }
  return parseJsonField<HeroContent>(rows.home.hero, 'marketing_home.hero');
}

export async function getContextCards(): Promise<ContextCard[]> {
  const rows = await fetchMarketingRows();
  if (!rows.home?.context_cards) {
    return DEFAULT_CONTEXT_CARDS;
  }
  return parseJsonField<ContextCard[]>(rows.home.context_cards, 'marketing_home.context_cards');
}

export async function getSupportEntries(): Promise<{ urgent: SupportEntry[]; mutualAid: string[] }> {
  const rows = await fetchMarketingRows();
  const urgent = rows.supports?.urgent
    ? parseJsonField<SupportEntry[]>(rows.supports.urgent, 'marketing_supports.urgent')
    : DEFAULT_SUPPORT_ENTRIES;
  const mutualAid = rows.supports?.mutual_aid
    ? parseJsonField<string[]>(rows.supports.mutual_aid, 'marketing_supports.mutual_aid')
    : DEFAULT_MUTUAL_AID;
  assertUrgentSupportContacts(urgent);
  return { urgent, mutualAid };
}

export async function getProgramEntries(): Promise<ProgramEntry[]> {
  const rows = await fetchMarketingRows();
  if (!rows.programs?.programs) {
    return DEFAULT_PROGRAMS;
  }
  return parseJsonField<ProgramEntry[]>(rows.programs.programs, 'marketing_programs.programs');
}
