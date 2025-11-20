import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import type { Database } from '@/types/supabase';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { sanitizeResourceHtml } from '@/lib/sanitize-resource-html';

export const POLICY_CATEGORY_LABELS = {
  client_rights: 'Client rights',
  safety: 'Safety & risk',
  staff: 'Staff guidance',
  governance: 'Governance',
  operations: 'Operations',
  finance: 'Finance & procurement',
} as const;

export type PolicyCategory = keyof typeof POLICY_CATEGORY_LABELS;
export type PolicyStatus = Database['portal']['Enums']['policy_status'];

export type Policy = {
  id: string;
  slug: string;
  title: string;
  category: PolicyCategory;
  shortSummary: string;
  bodyHtml: string;
  status: PolicyStatus;
  sortOrder: number;
  lastReviewedAt: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
};

const POLICY_SELECT = `
  id,
  slug,
  title,
  category,
  short_summary,
  body_html,
  status,
  is_published,
  internal_ref,
  sort_order,
  last_reviewed_at,
  effective_from,
  effective_to,
  created_by_profile_id,
  updated_by_profile_id,
  created_at,
  updated_at
`;

const fetchPublishedPoliciesCached = unstable_cache(
  async (): Promise<Policy[]> => {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('policies')
      .select(POLICY_SELECT)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapPolicyRow);
  },
  ['publishedPolicies'],
  { tags: [CACHE_TAGS.policies] },
);

export async function fetchPublishedPolicies(): Promise<Policy[]> {
  return fetchPublishedPoliciesCached();
}

const fetchPolicyBySlugCached = unstable_cache(
  async (slug: string): Promise<Policy | null> => {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('policies')
      .select(POLICY_SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data ? mapPolicyRow(data) : null;
  },
  ['policyBySlug'],
  { tags: [CACHE_TAGS.policies] },
);

export async function getPublishedPolicyBySlug(slug: string): Promise<Policy | null> {
  return fetchPolicyBySlugCached(slug);
}

function mapPolicyRow(row: Database['portal']['Tables']['policies']['Row']): Policy {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category as PolicyCategory,
    shortSummary: row.short_summary,
    bodyHtml: sanitizeResourceHtml(row.body_html ?? ''),
    status: row.status as PolicyStatus,
    sortOrder: row.sort_order,
    lastReviewedAt: row.last_reviewed_at,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
