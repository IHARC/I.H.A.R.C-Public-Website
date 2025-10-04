import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import type { IdeaSummary } from '@/components/portal/idea-card';
import { IdeaCard } from '@/components/portal/idea-card';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import type { Database } from '@/types/supabase';

const METRIC_LABELS: Record<string, string> = {
  outdoor_count: 'Outdoor Individuals',
  shelter_occupancy: 'Shelter Occupancy (%)',
  overdoses_reported: 'Overdoses Reported',
  narcan_distributed: 'Narcan Kits Distributed',
  encampment_count: 'Encampments Observed',
  warming_beds_available: 'Warming Beds Available',
};

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerProfile = user ? await ensurePortalProfile(user.id) : null;

  const metricCards = await loadMetricHighlights(supabase);
  const spotlightIdeas = await loadSpotlightIdeas(supabase);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-start">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Command Center</p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Coordinate solutions with neighbours, agencies, and municipal partners.
          </h2>
          <p className="text-base text-slate-700 dark:text-slate-300">
            Use this hub to follow live commitments, submit ideas, and document actions that move people into safer housing and harm reduction supports. Language stays plain and people-first so everyone can contribute confidently.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/solutions/submit"
              className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Share a community solution
            </Link>
            <Link
              href="/solutions"
              className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Browse ideas and discussions
            </Link>
            <Link
              href="/stats"
              className="inline-flex items-center rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              View real-time metrics
            </Link>
          </div>
        </div>
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Your participation</h3>
          {viewerProfile ? (
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>
                Signed in as <span className="font-medium text-slate-900 dark:text-slate-100">{viewerProfile.display_name}</span>
                {viewerProfile.organization_id ? ' with a linked organization.' : '.'}
              </li>
              <li>
                Role:{' '}
                <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{viewerProfile.role.replace('_', ' ')}</span>
              </li>
              <li>
                Keep your profile up to date so neighbours know who is sharing insights.
              </li>
              <li>
                <Link href="/solutions/profile" className="text-brand underline">
                  Update profile
                </Link>
              </li>
            </ul>
          ) : (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                Create an account to vote on ideas, leave respectful comments, and access moderation tools when available.
              </p>
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
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Real-time signals</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Key metrics from the stats dashboard. Visit the full view for charts and trends.</p>
          </div>
          <Link href="/stats" className="text-sm font-semibold text-brand underline">
            Open stats dashboard
          </Link>
        </header>
        {metricCards.length ? (
          <DashboardCards items={metricCards} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Metrics will appear once data partners publish daily updates.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Community ideas in motion</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Recent proposals moving through the sprint pipeline.</p>
          </div>
          <Link href="/solutions" className="text-sm font-semibold text-brand underline">
            Explore the board
          </Link>
        </div>
        {spotlightIdeas.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {spotlightIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Be the first to submit a solution so neighbours can collaborate.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">How rapid response works here</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Ideas move from community submission to sprint planning in the open. Moderators support respectful dialogue, and agencies mark official commitments so everyone sees what is active, paused, or complete.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Neighbours share grounded observations and solution ideas.</li>
            <li>Agencies and Town staff weigh in with data, pilots, and resources.</li>
            <li>Rapid iteration keeps dignity and harm reduction at the center.</li>
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Need support getting started?</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Connect with the facilitation team for orientation, training, or questions about privacy. We can also help agencies automate data feeds into the stats dashboard.
          </p>
          <div className="mt-3 text-sm">
            <a href="mailto:portal@iharc.ca" className="font-semibold text-brand underline">
              portal@iharc.ca
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}

async function loadMetricHighlights(client: SupabaseClient<Database>) {
  const portal = client.schema('portal');
  try {
    const { data, error } = await portal
      .from('metric_daily')
      .select('metric_key, metric_date, value')
      .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
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

async function loadSpotlightIdeas(client: SupabaseClient<Database>) {
  const portal = client.schema('portal');
  try {
    const { data, error } = await portal
      .from('ideas')
      .select(
        `id,
         title,
         body,
         problem_statement,
         proposal_summary,
         category,
         status,
         tags,
         vote_count,
         comment_count,
         last_activity_at,
         created_at,
         is_anonymous,
         author:author_profile_id(id, display_name, organization:organization_id(name, verified))`
      )
      .order('last_activity_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Failed to load spotlight ideas', error);
      return [];
    }

    return (data ?? []).map((idea) => {
      const authorRaw = Array.isArray(idea.author) ? idea.author[0] : idea.author;
      const organizationRaw = authorRaw && 'organization' in authorRaw ? authorRaw.organization : null;
      const organization = Array.isArray(organizationRaw) ? organizationRaw[0] : organizationRaw;

      const preview: IdeaSummary = {
        id: idea.id,
        title: idea.title,
        body: idea.body,
        problemStatement: idea.problem_statement,
        proposalSummary: idea.proposal_summary,
        category: idea.category,
        status: idea.status,
        tags: idea.tags ?? [],
        voteCount: idea.vote_count ?? 0,
        commentCount: idea.comment_count ?? 0,
        lastActivityAt: idea.last_activity_at,
        createdAt: idea.created_at,
        isAnonymous: idea.is_anonymous,
        authorDisplayName: authorRaw?.display_name ?? 'Community member',
        organizationName: organization?.name ?? null,
        orgVerified: organization?.verified ?? false,
        officialCount: undefined,
      };
      return preview;
    });
  } catch (error) {
    console.error('Failed to load spotlight ideas', error);
    return [];
  }
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
