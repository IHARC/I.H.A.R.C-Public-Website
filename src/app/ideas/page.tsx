import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Info } from 'lucide-react';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import type { IdeaSummary } from '@/components/portal/idea-card';
import { IdeaCard } from '@/components/portal/idea-card';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import { SearchBar } from '@/components/portal/search-bar';
import { Filters } from '@/components/portal/filters';
import { EmptyState } from '@/components/portal/empty-state';
import { KanbanBoard, STATUS_COLUMNS, type ColumnKey } from '@/components/portal/kanban-board';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Database } from '@/types/supabase';

const METRIC_LABELS: Record<string, string> = {
  outdoor_count: 'Neighbours Outdoors',
  shelter_occupancy: 'Shelter Occupancy (%)',
  overdoses_reported: 'Drug Poisoning Emergencies',
  narcan_distributed: 'Naloxone Kits Shared',
  encampment_count: 'Encampment Sites Documented',
  warming_beds_available: 'Warming Beds Available',
};

export const dynamic = 'force-dynamic';

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const metricRangeParam = resolvedParams.metricsRange;
  const metricRange = (Array.isArray(metricRangeParam) ? metricRangeParam[0] : metricRangeParam) === '30d' ? 30 : 7;

  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerProfile = user ? await ensurePortalProfile(user.id) : null;

  const metricCards = await loadMetricHighlights(supabase, metricRange);
  const metricSummary = metricCards.length
    ? buildMetricSummary(metricCards)
    : 'Metric data will surface here once partners publish updates.';

  const ideaBoard = await loadIdeaBoard({ supabase, resolvedParams });
  const viewerRole = viewerProfile?.role ?? null;
  const spotlightIdeas = ideaBoard.slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <TooltipProvider>
        <header className="grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-start">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand">Proposal queue</p>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Ideas neighbours are shaping</h1>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand/70 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300"
                    aria-label="What this page is for"
                  >
                    <Info className="h-4 w-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-left">
                  What this page is for: crowdsource plain-language ideas, document evidence, and get them ready for Working Plans.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300">
              <strong>How this works</strong> — 1) Share an idea. 2) Build support and answer questions. 3) If it meets the bar, it becomes a Working Plan everyone can help shape.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Keep proposals centred on housing, health, and dignity. Punitive sweeps or suggestions that criminalize neighbours will not be promoted.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ideas/submit"
                className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Share an idea
              </Link>
              <Link
                href="/stats"
                className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Open the full stats dashboard
              </Link>
              {!viewerProfile ? (
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Register to contribute
                </Link>
              ) : null}
            </div>
          </div>
          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Your participation</h2>
            {viewerProfile ? (
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li>
                  Signed in as{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{viewerProfile.display_name}</span>
                  {viewerProfile.organization_id ? ' with a linked organization.' : '.'}
                </li>
                <li>
                  Role:{' '}
                  <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{viewerProfile.role.replace('_', ' ')}</span>
                </li>
                <li>Keep your profile current so neighbours know who is contributing.</li>
                <li>
                  <Link href="/ideas/submit" className="text-brand underline">
                    Submit another idea
                  </Link>
                </li>
                <li>
                  {viewerProfile.role === 'moderator' || viewerProfile.role === 'admin' ? (
                    <Link href="/solutions/mod" className="text-brand underline">
                      Review the moderation queue
                    </Link>
                  ) : (
                    <span>Need moderator support? Email portal@iharc.ca.</span>
                  )}
                </li>
              </ul>
            ) : (
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Create an account to vote once per idea, leave questions or suggestions, and see assignment updates.</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Link
                    href="/register"
                    className="inline-flex items-center rounded-full bg-brand px-4 py-2 font-semibold text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </header>
      </TooltipProvider>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Live community indicators</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Snapshot of the latest partner-reported metrics. Visit the stats dashboard for full charts and context.
            </p>
          </div>
          <RangeSelector active={metricRange} params={resolvedParams} />
        </div>
        <p className="sr-only" aria-live="polite">
          {metricSummary}
        </p>
        {metricCards.length ? (
          <DashboardCards items={metricCards} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Metrics will appear once data partners publish daily updates.
          </div>
        )}
      </section>

      <section className="space-y-6" id="ideas">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Community sprint board</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Search, filter, and collaborate on ideas in flight. Columns reflect the current sprint pipeline.
            </p>
          </div>
          <SearchBar placeholder="Search ideas by keyword" />
        </div>
        <Filters />
        {ideaBoard.length ? (
          <KanbanBoard
            ideas={ideaBoard.map((idea) => {
              const statusKey = STATUS_COLUMNS.some((column) => column.key === (idea.status as ColumnKey))
                ? (idea.status as ColumnKey)
                : 'new';
              return { ...idea, status: statusKey };
            })}
            viewerRole={viewerRole}
          />
        ) : (
          <EmptyState
            title="No ideas match your filters"
            description="Adjust filters or be the first to share an idea so neighbours can collaborate."
            cta={{ label: 'Submit an idea', href: '/ideas/submit' }}
          />
        )}
      </section>

      {spotlightIdeas.length ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Ideas gaining momentum</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Highlights from the queue based on recent activity. Join the threads to help them become Working Plans.
              </p>
            </div>
            <Link href="/ideas/submit" className="text-sm font-semibold text-brand underline">
              Add a new idea
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {spotlightIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Rapid response in plain language</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Ideas open in public. Partners post data, pilots, and commitments right on the cards so everyone knows what is
            active, paused, or complete. Moderators keep the process strengths-based and accessible.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Need onboarding or facilitation?</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Email <a className="font-semibold text-brand underline" href="mailto:portal@iharc.ca">portal@iharc.ca</a> for
            help connecting data feeds, learning the sprint workflow, or supporting anonymous participation.
          </p>
        </article>
      </section>
    </div>
  );
}

async function loadMetricHighlights(client: SupabaseClient<Database>, range: number) {
  const portal = client.schema('portal');
  try {
    const { data, error } = await portal
      .from('metric_daily')
      .select('metric_key, metric_date, value')
      .gte('metric_date', new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order('metric_date', { ascending: true });

    if (error) {
      console.error('Failed to load metric highlights', error);
      return [];
    }

    const grouped = groupMetrics(data ?? []);
    const cards = buildCardData(grouped).sort((a, b) => (a.key < b.key ? -1 : 1));
    return cards.slice(0, 4);
  } catch (error) {
    console.error('Failed to load metric highlights', error);
    return [];
  }
}

async function loadIdeaBoard({
  supabase,
  resolvedParams,
}: {
  supabase: SupabaseClient<Database>;
  resolvedParams: Record<string, string | string[] | undefined>;
}) {
  const portal = supabase.schema('portal');
  const categoryParam = resolvedParams.category;
  const statusParam = resolvedParams.status;
  const tagParam = resolvedParams.tag;
  const sortParam = resolvedParams.sort;
  const queryParam = resolvedParams.q;

  const category = categoryParam ? (Array.isArray(categoryParam) ? categoryParam[0] : categoryParam) : null;
  const status = statusParam ? (Array.isArray(statusParam) ? statusParam[0] : statusParam) : null;
  const tag = tagParam ? (Array.isArray(tagParam) ? tagParam[0] : tagParam) : null;
  const sort = sortParam ? (Array.isArray(sortParam) ? sortParam[0] : sortParam) : 'active';
  const q = queryParam ? (Array.isArray(queryParam) ? queryParam[0] : queryParam) : null;

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
    console.error('Unable to load ideas', error);
    throw new Error('Unable to load ideas');
  }

  const ideaList = ideas ?? [];
  if (!ideaList.length) {
    return [];
  }

  const profileIds = Array.from(new Set(ideaList.map((idea) => idea.author_profile_id)));

  const { data: profiles } = await portal
    .from('profiles')
    .select('id, display_name, organization_id, position_title, affiliation_status, role')
    .in('id', profileIds.length ? profileIds : ['00000000-0000-0000-0000-000000000000']);

  const organizationIds = Array.from(
    new Set((profiles ?? []).map((profile) => profile.organization_id).filter(Boolean)),
  ) as string[];

  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name, verified')
    .in('id', organizationIds.length ? organizationIds : ['00000000-0000-0000-0000-000000000000']);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const organizationMap = new Map((organizations ?? []).map((org) => [org.id, org]));

  const ideaSummaries: IdeaSummary[] = ideaList.map((idea) => {
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
      tags: idea.tags ?? [],
      voteCount: idea.vote_count ?? 0,
      commentCount: idea.comment_count ?? 0,
      lastActivityAt: idea.last_activity_at,
      createdAt: idea.created_at,
      isAnonymous: idea.is_anonymous,
      authorDisplayName: profile?.display_name ?? 'Community Member',
      positionTitle: approvedPosition,
      organizationName: organization?.name ?? null,
      orgVerified: organization?.verified ?? false,
      officialCount: undefined,
    };
  });

  return ideaSummaries;
}

type MetricRow = {
  metric_key: string;
  metric_date: string;
  value: number | null;
};

type MetricSeries = Record<string, MetricRow[]>;

type MetricCard = {
  key: string;
  label: string;
  value: string;
  caption?: string;
  description?: string;
  trend: 'up' | 'down' | 'flat';
};

function groupMetrics(rows: MetricRow[]) {
  return rows.reduce<MetricSeries>((acc, row) => {
    if (!acc[row.metric_key]) acc[row.metric_key] = [];
    acc[row.metric_key].push(row);
    return acc;
  }, {});
}

function buildCardData(grouped: MetricSeries): MetricCard[] {
  return Object.entries(grouped).map(([key, series]) => {
    const ordered = [...series].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
    const latest = ordered[ordered.length - 1];
    const first = ordered[0];
    const latestValue = latest?.value ?? null;
    const firstValue = first?.value ?? null;
    const delta = (latestValue ?? 0) - (firstValue ?? 0);
    const trend: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      key,
      label: METRIC_LABELS[key] ?? key,
      value: formatMetric(latestValue),
      caption: latest ? `Updated ${new Date(latest.metric_date).toLocaleDateString('en-CA')}` : undefined,
      description:
        ordered.length > 1 && first
          ? `Change ${delta > 0 ? '+' : ''}${delta.toFixed(1)} since ${new Date(first.metric_date).toLocaleDateString('en-CA')}`
          : undefined,
      trend,
    };
  });
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  if (numeric % 1 === 0) return numeric.toLocaleString('en-CA');
  return numeric.toFixed(1);
}

function buildMetricSummary(cards: MetricCard[]) {
  return cards
    .map((card) => {
      const trendWord = card.trend === 'up' ? 'increased' : card.trend === 'down' ? 'decreased' : 'held steady';
      if (!card.description) {
        return `${card.label} reported ${card.value}.`;
      }
      return `${card.label} ${trendWord}. ${card.description}.`;
    })
    .join(' ');
}

function RangeSelector({
  active,
  params,
}: {
  active: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const base = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'metricsRange') continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => base.append(key, entry));
    } else if (value) {
      base.set(key, value);
    }
  }

  const buildHref = (target: number) => {
    const next = new URLSearchParams(base);
    if (target === 30) {
      next.set('metricsRange', '30d');
    } else {
      next.delete('metricsRange');
    }
    const query = next.toString();
    return query ? `?${query}` : '?';
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={buildHref(7)}
        className={
          'rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand' +
          (active === 7
            ? ' bg-brand text-white shadow'
            : ' border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800')
        }
      >
        7-day
      </Link>
      <Link
        href={buildHref(30)}
        className={
          'rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand' +
          (active === 30
            ? ' bg-brand text-white shadow'
            : ' border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800')
        }
      >
        30-day
      </Link>
    </div>
  );
}
