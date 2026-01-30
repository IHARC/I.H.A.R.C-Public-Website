import { unstable_cache } from 'next/cache';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { Database } from '@/types/supabase';

export type VolunteerRole = {
  id: string;
  organizationId: number;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  location: string | null;
  timeCommitment: string | null;
  requirements: string | null;
  publishedAt: string | null;
  closesAt: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type VolunteerRoleRow = Pick<
  Database['portal']['Tables']['volunteer_role_listings']['Row'],
  | 'id'
  | 'organization_id'
  | 'slug'
  | 'title'
  | 'summary'
  | 'description'
  | 'location'
  | 'time_commitment'
  | 'requirements'
  | 'is_public'
  | 'published_at'
  | 'closes_at'
  | 'created_at'
  | 'updated_at'
>;

const ROLE_SELECT = `
  id,
  organization_id,
  slug,
  title,
  summary,
  description,
  location,
  time_commitment,
  requirements,
  is_public,
  published_at,
  closes_at,
  created_at,
  updated_at
`;

const VOLUNTEER_ROLE_REVALIDATE_SECONDS = 60;

const fetchVolunteerRolesCached = unstable_cache(
  async (): Promise<VolunteerRole[]> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('volunteer_role_listings')
      .select(ROLE_SELECT)
      .order('published_at', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapRoleRow);
  },
  ['volunteerRoles'],
  { tags: [CACHE_TAGS.volunteerRoles], revalidate: VOLUNTEER_ROLE_REVALIDATE_SECONDS },
);

const fetchVolunteerRoleBySlugCached = unstable_cache(
  async (slug: string): Promise<VolunteerRole | null> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('volunteer_role_listings')
      .select(ROLE_SELECT)
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? mapRoleRow(data) : null;
  },
  ['volunteerRoleBySlug'],
  { tags: [CACHE_TAGS.volunteerRoles], revalidate: VOLUNTEER_ROLE_REVALIDATE_SECONDS },
);

export async function fetchVolunteerRoles(): Promise<VolunteerRole[]> {
  return fetchVolunteerRolesCached();
}

export async function getVolunteerRoleBySlug(slug: string): Promise<VolunteerRole | null> {
  return fetchVolunteerRoleBySlugCached(slug);
}

export function isVolunteerRoleOpen(role: Pick<VolunteerRole, 'isPublic' | 'publishedAt' | 'closesAt'>): boolean {
  if (!role.isPublic) return false;
  const now = new Date();
  if (role.publishedAt && new Date(role.publishedAt) > now) return false;
  if (role.closesAt && new Date(role.closesAt) <= now) return false;
  return true;
}

export function formatVolunteerDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function mapRoleRow(row: VolunteerRoleRow): VolunteerRole {
  return {
    id: row.id,
    organizationId: row.organization_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    location: row.location,
    timeCommitment: row.time_commitment,
    requirements: row.requirements,
    publishedAt: row.published_at,
    closesAt: row.closes_at,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
