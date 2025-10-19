import Link from 'next/link';
import { Info } from 'lucide-react';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { copyDeck } from '@/lib/copy';
import { IdeaCard } from '@/components/portal/idea-card';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import { SearchBar } from '@/components/portal/search-bar';
import { Filters } from '@/components/portal/filters';
import { EmptyState } from '@/components/portal/empty-state';
import { KanbanBoard } from '@/components/portal/kanban-board';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isIdeaStatusKey, type IdeaStatusKey } from '@/lib/idea-status';
import { getMetricCards, getMetricSummary } from '@/data/metrics';
import { getIdeaBoard, type IdeaBoardFilters } from '@/data/ideas';

export const dynamic = 'force-dynamic';

const { communityStandards, boards } = copyDeck;

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

  const viewerProfile = user ? await ensurePortalProfile(supabase, user.id) : null;

  const metricCards = await getMetricCards(metricRange, user?.id ?? null);
  const metricSummary = metricCards.length
    ? await getMetricSummary(metricRange, user?.id ?? null)
    : 'Metric data will surface here once partners publish updates.';

  const categoryParam = resolvedParams.category;
  const statusParam = resolvedParams.status;
  const tagParam = resolvedParams.tag;
  const sortParam = resolvedParams.sort;
  const queryParam = resolvedParams.q;

  const category = categoryParam ? (Array.isArray(categoryParam) ? categoryParam[0] : categoryParam) : null;
  const status = statusParam ? (Array.isArray(statusParam) ? statusParam[0] : statusParam) : null;
  const tag = tagParam ? (Array.isArray(tagParam) ? tagParam[0] : tagParam) : null;
  const rawSort = sortParam ? (Array.isArray(sortParam) ? sortParam[0] : sortParam) : null;
  const sort: IdeaBoardFilters['sort'] = rawSort === 'newest' || rawSort === 'top' ? rawSort : 'active';
  const query = queryParam ? (Array.isArray(queryParam) ? queryParam[0] : queryParam) : null;

  const filters: IdeaBoardFilters = {
    category,
    status,
    tag,
    sort,
    query,
  };

  const ideaBoard = await getIdeaBoard(filters, viewerProfile?.id ?? user?.id ?? null);
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
            <p className="text-sm text-slate-600 dark:text-slate-300">{communityStandards.stance}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{communityStandards.reminder}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/portal/ideas/submit"
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
                  <Link href="/portal/ideas/submit" className="text-brand underline">
                    Submit another idea
                  </Link>
                </li>
                <li>
                  {viewerProfile.role === 'moderator' || viewerProfile.role === 'admin' ? (
                    <Link href="/solutions/mod" className="text-brand underline">
                      Review the moderation queue
                    </Link>
                  ) : (
                    <span>
                      Need moderator support? Email portal@iharc.ca.
                    </span>
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
          <DashboardCards
            items={metricCards.map(({ sortOrder: _sortOrder, status: _status, ...card }) => card)}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Metrics will appear once data partners publish daily updates.
          </div>
        )}
      </section>

      <section className="space-y-6" id="ideas">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {boards.communityProject.label}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{boards.communityProject.description}</p>
          </div>
          <SearchBar placeholder="Search ideas by keyword" />
        </div>
        <Filters />
        {ideaBoard.length ? (
          <KanbanBoard
            ideas={ideaBoard.map((idea) => {
              const statusKey: IdeaStatusKey = isIdeaStatusKey(idea.status)
                ? idea.status
                : 'new';
              return { ...idea, status: statusKey };
            })}
            viewerRole={viewerRole}
          />
        ) : (
          <EmptyState
            title="No ideas match your filters"
            description="Adjust filters or be the first to share an idea so neighbours can collaborate."
            cta={{ label: 'Submit an idea', href: '/portal/ideas/submit' }}
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
            <Link href="/portal/ideas/submit" className="text-sm font-semibold text-brand underline">
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
            help connecting data feeds, learning the {boards.communityProject.workflowLabel}, or supporting anonymous
            participation.
          </p>
        </article>
      </section>
    </div>
  );
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
