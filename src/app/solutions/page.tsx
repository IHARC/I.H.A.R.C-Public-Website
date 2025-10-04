import { Metadata } from 'next';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { type IdeaSummary } from '@/components/portal/idea-card';
import { SearchBar } from '@/components/portal/search-bar';
import { Filters } from '@/components/portal/filters';
import { EmptyState } from '@/components/portal/empty-state';
import { KanbanBoard, STATUS_COLUMNS, type ColumnKey } from '@/components/portal/kanban-board';

export const metadata: Metadata = {
  title: 'Community Solutions',
};

export default async function SolutionsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const category = (searchParams.category as string) ?? null;
  const status = (searchParams.status as string) ?? null;
  const tag = (searchParams.tag as string) ?? null;
  const sort = (searchParams.sort as string) ?? 'active';
  const q = (searchParams.q as string) ?? null;

  const supabase = createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerProfile: Awaited<ReturnType<typeof ensurePortalProfile>> | null = null;
  if (user) {
    viewerProfile = await ensurePortalProfile(user.id);
  }

  let query = portal
    .from('ideas')
    .select('*', { count: 'exact' })
    .range(0, 199);

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (tag) query = query.contains('tags', [tag]);
  if (q) query = query.textSearch('search_vector', q, { type: 'websearch' });

  switch (sort) {
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

  const { data: ideas, error } = await query;
  if (error) {
    console.error(error);
    throw new Error('Unable to load ideas');
  }

  const ideaList = ideas ?? [];
  const profileIds = Array.from(new Set(ideaList.map((idea) => idea.author_profile_id)));

  const { data: profiles } = await portal
    .from('profiles')
    .select('id, display_name, organization_id')
    .in('id', profileIds.length ? profileIds : ['00000000-0000-0000-0000-000000000000']);

  const organizationIds = Array.from(new Set((profiles ?? []).map((profile) => profile.organization_id).filter(Boolean))) as string[];
  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name, verified')
    .in('id', organizationIds.length ? organizationIds : ['00000000-0000-0000-0000-000000000000']);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const organizationMap = new Map((organizations ?? []).map((org) => [org.id, org]));

  const ideaSummaries: IdeaSummary[] = ideaList.map((idea) => {
    const profile = profileMap.get(idea.author_profile_id);
    const organization = profile?.organization_id ? organizationMap.get(profile.organization_id) : null;
    return {
      id: idea.id,
      title: idea.title,
      body: idea.proposal_summary ?? idea.problem_statement ?? idea.body,
      problemStatement: idea.problem_statement ?? null,
      proposalSummary: idea.proposal_summary ?? null,
      category: idea.category,
      status: idea.status,
      tags: idea.tags ?? [],
      voteCount: idea.vote_count ?? 0,
      commentCount: idea.comment_count ?? 0,
      lastActivityAt: idea.last_activity_at,
      createdAt: idea.created_at,
      isAnonymous: idea.is_anonymous,
      authorDisplayName: profile?.display_name ?? 'Community Member',
      organizationName: organization?.name ?? null,
      orgVerified: organization?.verified ?? false,
      officialCount: undefined,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Community Solutions Board</h2>
          <SearchBar placeholder="Search ideas by keyword" />
        </div>
        <Filters />
      </header>

      {ideaSummaries.length === 0 ? (
        <EmptyState
          title="No ideas match your filters"
          description="Try adjusting the filters or contribute the first solution."
          cta={{ label: 'Submit an idea', href: '/solutions/submit' }}
        />
      ) : (
        <KanbanBoard
          ideas={ideaSummaries.map((idea) => {
            const statusKey = STATUS_COLUMNS.some((column) => column.key === (idea.status as ColumnKey))
              ? (idea.status as ColumnKey)
              : 'new';
            return { ...idea, status: statusKey };
          })}
          viewerRole={viewerProfile?.role ?? null}
        />
      )}
    </div>
  );
}
