import type { Metadata } from 'next';
import Link from 'next/link';

import { BreakdownChart } from '@/components/pit/breakdown-chart';
import { TrendChart } from '@/components/portal/trend-chart';
import type { PitBreakdownRow, PitSummaryRow } from '@/lib/pit/public';
import {
  formatCount,
  formatSupportRate,
  groupBreakdownsForCount,
  loadPitPublicDataset,
  pickFeaturedSummary,
  sortSummariesByWindow,
  toChartData,
} from '@/lib/pit/public';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';

const datasets = [
  {
    title: 'Daily housing indicators',
    description:
      'Shelter occupancy, motel overflow usage, and the number of neighbours recorded outdoors or in encampments. Updated by County housing staff with on-call validation from outreach teams.',
  },
  {
    title: 'Overdose response signals',
    description:
      'Emergency calls, naloxone kit distribution, peer response alerts, and follow-up support. Aggregated by public health partners to protect privacy while tracking trends.',
  },
  {
    title: 'Plan accountability metrics',
    description:
      'Each Working Plan publishes the measures community members chose—like clinical referrals completed, units secured, or outreach shifts added—so progress stays transparent.',
  },
];

const dataPrinciples = [
  'We publish trendlines and deltas, never identifying details.',
  'Community reviewers can request corrections when numbers feel off.',
  'Data stewards log their name and organization on every update.',
  'When data is delayed, we post a note explaining why and what comes next.',
];

export const metadata: Metadata = {
  title: 'Community Data & Metrics — IHARC',
  description:
    'Understand which housing and overdose response indicators feed the IHARC Portal and how neighbours can request new metrics.',
  alternates: {
    canonical: '/data',
  },
  openGraph: {
    type: 'website',
    title: 'Community Data & Metrics — IHARC',
    description:
      'Understand which housing and overdose response indicators feed the IHARC Portal and how neighbours can request new metrics.',
    url: '/data',
    images: [
      {
        url: '/logo.png',
        alt: 'IHARC — Integrated Homelessness and Addictions Response Centre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Data & Metrics — IHARC',
    description:
      'Understand which housing and overdose response indicators feed the IHARC Portal and how neighbours can request new metrics.',
    images: ['/logo.png'],
  },
};

export default async function DataPage() {
  const supabase = await createSupabaseRSCClient();

  let summaries: PitSummaryRow[] = [];
  let breakdownRows: PitBreakdownRow[] = [];

  try {
    const dataset = await loadPitPublicDataset(supabase);
    summaries = dataset.summaries;
    breakdownRows = dataset.breakdowns;
  } catch (error) {
    console.error('Unable to load point-in-time dataset', error);
  }

  const featured = pickFeaturedSummary(summaries);
  const dimensionGroups = featured ? groupBreakdownsForCount(breakdownRows, featured.id) : [];
  const breakdownMap = new Map(dimensionGroups.map((group) => [group.dimension, group]));

  const getChartData = (dimension: string) => {
    const group = breakdownMap.get(dimension);
    return group ? toChartData(group.rows) : [];
  };

  const ageChart = getChartData('age_bracket');
  const genderChart = getChartData('gender');
  const readinessChart = getChartData('willing_to_engage');
  const addictionChart = getChartData('addiction_severity');
  const mentalHealthChart = getChartData('mental_health_severity');

  const orderedSummaries = sortSummariesByWindow(summaries);
  const trendSeries = orderedSummaries.map((entry) => ({
    date: formatTrendDate(entry),
    value: entry.total_encounters,
  }));
  const trendRangeLabel = buildTrendRangeLabel(orderedSummaries);

  const heroCards = featured ? buildHeroCards(featured) : [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community Data</p>
        <h1 className="text-4xl font-bold tracking-tight">Metrics that keep the response accountable</h1>
        <p className="text-base text-on-surface/80">
          IHARC shares the data neighbours asked for most often. Each dataset is stewarded by a public agency or trusted partner, and every chart links back to the responsible team so you can ask questions or suggest new measures.
        </p>
        <p className="text-sm text-on-surface/70">
          We timestamp every update and link to the stewarding team so you always know who published the numbers and when.
        </p>
      </header>

      {featured ? (
        <section className="space-y-8 rounded-3xl border border-outline/10 bg-surface p-8 shadow-sm">
          <header className="space-y-3 text-balance">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Point-in-Time Outreach</p>
            <h2 className="text-3xl font-semibold text-on-surface">{featured.title || 'Weekly point-in-time count'}</h2>
            <p className="text-sm text-on-surface-variant">
              {featured.description ??
                'Neighbours, outreach teams, and municipal staff walk the same routes together so we can understand who is outside right now and what supports they trust.'}
            </p>
            <p className="text-sm font-semibold text-error">
              In an emergency call 911. The Good Samaritan Drug Overdose Act protects the caller and the person experiencing an overdose.
            </p>
            <p className="text-sm text-on-surface-variant">
              Need help between counts? Email <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a> or connect with the RAAM clinic (Tuesdays, 12–3&nbsp;pm at 1011 Elgin St. W.).
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {heroCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-outline/20 bg-surface-container-high p-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-on-surface">{card.value}</p>
                <p className="mt-1 text-xs text-on-surface-variant/90">{card.caption}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-on-surface-variant">
            {formatCount(featured.mental_health_positive_count)} neighbours asked for mental health follow-ups this round. Our moderators work with NHH Community Mental Health Services (905-377-9891) so those conversations continue with dignity.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownChart
              title="Who we connected with by age"
              description="Counts reflect neighbours present during this point-in-time window. Cells under three are suppressed to protect privacy."
              data={ageChart}
            />
            <BreakdownChart
              title="Gender self-described"
              description="Neighbours self-identify, and outreach teams only log what people are comfortable sharing."
              data={genderChart}
            />
            <BreakdownChart
              title="Support readiness"
              description="Shows how many neighbours were ready to engage immediately, needed extra support, or preferred to wait."
              data={readinessChart}
            />
            <BreakdownChart
              title="Substance use needs shared"
              description="Guides naloxone, medical needs, and RAAM referrals while keeping individual stories private."
              data={addictionChart}
            />
            <BreakdownChart
              title="Mental health needs shared"
              description="Helps pair mental health clinicians with the outreach teams residents already trust."
              data={mentalHealthChart}
            />
          </div>

          {trendSeries.length ? (
            <TrendChart
              title="Neighbours counted during each point-in-time window"
              description="Trendlines help us understand whether weekly counts are reaching the same number of community members."
              data={trendSeries}
              rangeLabel={trendRangeLabel}
            />
          ) : null}
        </section>
      ) : (
        <section className="space-y-4 rounded-3xl border border-outline/10 bg-surface p-8 text-sm text-on-surface-variant">
          <h2 className="text-2xl font-semibold text-on-surface">Point-in-time counts go live this week</h2>
          <p>
            We are finalizing the first dataset from the community point-in-time count. Once outreach stewards validate every row, this page will publish live charts and the anonymized public download.
          </p>
          <p className="font-semibold text-error">
            In an emergency call 911. The Good Samaritan Drug Overdose Act means you will not be charged for simple possession when you call for help.
          </p>
          <p>
            Need support now? Email <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a> and the outreach team will respond during business hours.
          </p>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">What we publish today</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {datasets.map((dataset) => (
            <article key={dataset.title} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-on-surface">{dataset.title}</h3>
              <p className="mt-2 text-sm text-on-surface/80">{dataset.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How we protect privacy</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {dataPrinciples.map((principle) => (
            <li key={principle} className="rounded-2xl border border-outline/20 bg-surface-container p-4 text-sm text-on-surface/80">
              {principle}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-outline/20 bg-surface p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Want to explore the latest numbers?</h2>
        <p className="mt-2">
          The portal&apos;s Progress view summarizes the last 30 days. For deeper analysis, partners can request access to the underlying tables through the moderation team.
        </p>
        <Link
          href="/portal/progress"
          className="mt-4 inline-flex w-fit rounded-full bg-primary px-5 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          View the 30-day snapshot
        </Link>
      </section>
    </div>
  );
}

type HeroCard = {
  label: string;
  value: string;
  caption: string;
};

function buildHeroCards(summary: PitSummaryRow): HeroCard[] {
  return [
    {
      label: 'Neighbours counted so far',
      value: formatCount(summary.total_encounters),
      caption: formatRange(summary),
    },
    {
      label: 'Ready to connect now',
      value: formatCount(summary.ready_for_support_count),
      caption: `${formatSupportRate(summary.ready_for_support_count, summary.total_encounters)} of responses`,
    },
    {
      label: 'Follow-up requested',
      value: formatCount(summary.follow_up_count),
      caption: 'Warm hand-offs underway with outreach teams',
    },
    {
      label: 'Substance use supports flagged',
      value: formatCount(summary.addiction_positive_count),
      caption: 'RAAM clinic: Tuesdays, 12–3 pm at 1011 Elgin St. W.',
    },
  ];
}

function formatRange(summary: PitSummaryRow): string {
  const start = formatDate(summary.observed_start);
  if (summary.is_active) {
    return `${start ?? 'Start'} → today`;
  }
  const end = formatDate(summary.observed_end ?? summary.last_observation_at);
  return `${start ?? 'Start'} → ${end ?? 'recently'}`;
}

function formatTrendDate(summary: PitSummaryRow): string {
  const candidate = summary.observed_end ?? summary.last_observation_at ?? summary.observed_start;
  return formatDate(candidate, { month: 'short', day: 'numeric' }) ?? 'TBD';
}

function buildTrendRangeLabel(entries: PitSummaryRow[]): string {
  if (!entries.length) return 'Awaiting first count';
  const first = entries[0];
  const last = entries[entries.length - 1];
  const start = formatDate(first.observed_start ?? first.last_observation_at, { month: 'short', year: 'numeric' }) ?? 'start';
  const end = formatDate(last.observed_end ?? last.last_observation_at, { month: 'short', year: 'numeric' }) ?? 'present';
  return start === end ? `${start} count` : `${start} – ${end}`;
}

function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', options ?? { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}
