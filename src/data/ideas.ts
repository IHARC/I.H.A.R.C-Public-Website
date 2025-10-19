import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { IdeaSummary } from '@/components/portal/idea-card';
import type { Database } from '@/types/supabase';
import { createReactionTally, type ReactionSummary, type PortalReactionType } from '@/lib/reactions';

export type IdeaBoardFilters = {
  category?: string | null;
  status?: string | null;
  tag?: string | null;
  sort?: 'active' | 'newest' | 'top';
  query?: string | null;
};

type IdeaBoardCacheKey = {
  viewerId: string | null;
  filters: IdeaBoardFilters;
};

type IdeaRow = Database['portal']['Tables']['ideas']['Row'];
type ProfileRow = Database['portal']['Tables']['profiles']['Row'];
type OrganizationRow = Database['portal']['Tables']['organizations']['Row'];

const IDEA_BOARD_REVALIDATE_SECONDS = 120;

const fetchIdeaBoard = unstable_cache(
  async ({ filters }: IdeaBoardCacheKey): Promise<IdeaSummary[]> => {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');

    let query = portal
      .from('ideas')
      .select('*', { count: 'exact' })
      .range(0, 199);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.tag) query = query.contains('tags', [filters.tag]);
    if (filters.query) query = query.textSearch('search_vector', filters.query, { type: 'websearch' });

    switch (filters.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'top':
        query = query.order('vote_count', { ascending: false });
        break;
      default:
        query = query.order('last_activity_at', { ascending: false });
        break;
    }

    const { data: ideas, error } = await query.returns<IdeaRow[]>();
    if (error) {
      console.error('Unable to load ideas', error);
      return [];
    }

    const ideaList = ideas ?? [];
    if (!ideaList.length) {
      return [];
    }

    const ideaIds = ideaList.map((idea) => idea.id);
    const reactionMap = new Map<string, ReactionSummary>();

    if (ideaIds.length) {
      const { data: reactionRows, error: reactionError } = await portal
        .from('idea_reaction_totals')
        .select('idea_id, reaction, reaction_count')
        .in('idea_id', ideaIds)
        .returns<{ idea_id: string; reaction: PortalReactionType; reaction_count: number }[]>();

      if (reactionError) {
        console.error('Failed to load idea reaction totals', reactionError);
      } else {
        for (const row of reactionRows ?? []) {
          let summary = reactionMap.get(row.idea_id);
          if (!summary) {
            summary = createReactionTally();
            reactionMap.set(row.idea_id, summary);
          }
          const count = Number(row.reaction_count ?? 0);
          summary[row.reaction] = Number.isFinite(count) ? count : 0;
        }
      }
    }

    const profileIds = Array.from(new Set(ideaList.map((idea) => idea.author_profile_id)));

    const { data: profiles, error: profileError } = await portal
      .from('profiles')
      .select('id, display_name, organization_id, position_title, affiliation_status, role, homelessness_experience, substance_use_experience')
      .in('id', profileIds.length ? profileIds : ['00000000-0000-0000-0000-000000000000'])
      .returns<ProfileRow[]>();

    if (profileError) {
      console.error('Failed to load idea authors', profileError);
    }

    const organizationIds = Array.from(
      new Set((profiles ?? []).map((profile) => profile.organization_id).filter(Boolean)),
    ) as string[];

    const { data: organizations, error: organizationError } = await portal
      .from('organizations')
      .select('id, name, verified')
      .in('id', organizationIds.length ? organizationIds : ['00000000-0000-0000-0000-000000000000'])
      .returns<OrganizationRow[]>();

    if (organizationError) {
      console.error('Failed to load organizations for ideas', organizationError);
    }

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const organizationMap = new Map((organizations ?? []).map((org) => [org.id, org]));

    return ideaList.map((idea) => {
      const profile = profileMap.get(idea.author_profile_id);
      const organization = profile?.organization_id ? organizationMap.get(profile.organization_id) : null;
      const approvedPosition =
        profile && profile.affiliation_status === 'approved' && profile.position_title ? profile.position_title : null;

      return {
        id: idea.id,
        title: idea.title,
        body: idea.proposal_summary ?? idea.problem_statement ?? idea.body,
        problemStatement: idea.problem_statement ?? null,
        proposalSummary: idea.proposal_summary ?? null,
        category: idea.category,
        status: idea.status,
        publicationStatus: idea.publication_status,
        tags: idea.tags ?? [],
        reactions: reactionMap.get(idea.id) ?? createReactionTally(),
        commentCount: idea.comment_count ?? 0,
        lastActivityAt: idea.last_activity_at,
        createdAt: idea.created_at,
        isAnonymous: idea.is_anonymous,
        authorDisplayName: profile?.display_name ?? 'Community Member',
        positionTitle: approvedPosition,
        organizationName: organization?.name ?? null,
        orgVerified: organization?.verified ?? false,
        officialCount: undefined,
        homelessnessExperience: profile?.homelessness_experience ?? null,
        substanceUseExperience: profile?.substance_use_experience ?? null,
      };
    });
  },
  ['portal:ideas:board'],
  {
    tags: [CACHE_TAGS.ideasList],
    revalidate: IDEA_BOARD_REVALIDATE_SECONDS,
  },
);

export async function getIdeaBoard(filters: IdeaBoardFilters, viewerId: string | null) {
  return fetchIdeaBoard({ filters, viewerId });
}
