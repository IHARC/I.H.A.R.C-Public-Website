import type { Metadata } from 'next';
import Link from 'next/link';

import { CrisisNotice } from '@/components/site/CrisisNotice';
import { getPitPublicDataset } from '@/data/pit';
import { buildMarketingMetadata } from '@/lib/site-metadata';
import { describePitStatus, formatCount, formatPitDateRange, sortSummariesByWindow } from '@/lib/pit/public';
import type { PitSummaryRow } from '@/lib/pit/public';
import { PitStatusBadge } from '@/components/pit/status-badge';
import { steviPortalUrl } from '@/lib/stevi-portal';

const datasets = [
  {
    title: 'Daily housing indicators',
    description:
      'Shelter occupancy, motel overflow usage, and outdoor observations help show how pressure is changing over time.',
  },
  {
    title: 'Overdose response signals',
    description:
      'Emergency trends, naloxone distribution, peer response activity, and follow-up supports are aggregated without exposing personal details.',
  },
  {
    title: 'Plan accountability measures',
    description:
      'Public working plans publish the measures the community asked to see so commitments can be tracked in the open.',
  },
];

const dataPrinciples = [
  'We publish trend data and counts, never identifying details.',
  'Updates are timestamped so the public can see how current the information is.',
  'Small cells are suppressed or grouped to protect privacy and dignity.',
  'When data is delayed or incomplete, we say so directly and explain what comes next.',
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMarketingMetadata({
    title: 'Community Data & Metrics — IHARC',
    description:
      'Understand the public data IHARC shares about homelessness response, outreach activity, and point-in-time observations in Northumberland County.',
    path: '/data',
  });
}

export const dynamic = 'force-dynamic';

export default async function DataPage() {
  const { summaries } = await getPitPublicDataset();
  const steviHomeUrl = steviPortalUrl('/');

  const orderedSummaries = sortSummariesByWindow(summaries).reverse();
  const activeSummary = orderedSummaries.find((entry) => describePitStatus(entry).code === 'active');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <div className="space-y-16">
        <header className="grid gap-8 border-b border-outline/12 pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
          <div className="max-w-3xl space-y-5 text-balance">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Community Data
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Public numbers that make the response easier to question and improve.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              IHARC publishes the measures people ask for most often: what pressure looks like on
              the response, how outreach conditions are shifting, and where the public record needs
              to stay honest about uncertainty.
            </p>
          </div>
          <div className="space-y-4 border-t border-outline/12 pt-6 text-sm leading-7 text-on-surface/72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p>
              This page is public by design. It explains trends, methodology, and what the numbers
              can and cannot say.
            </p>
            <p>
              Client-specific records and operational notes remain inside STEVI for participating
              teams only.
            </p>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Point-in-time outreach
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              A live view of current outdoor observations.
            </h2>
            <p className="text-sm leading-7 text-on-surface/74">
              PiT counts capture one structured moment in time. They do not include Transition House
              shelter residents or people who are temporarily staying with friends or family.
            </p>
          </div>
          <div className="space-y-5">
            <CrisisNotice variant="card" />
            {activeSummary ? (
              <div className="rounded-[1.75rem] bg-surface-container-low px-5 py-5 text-sm leading-7 text-on-surface/74">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
                  Active count
                </p>
                <p className="mt-2 font-medium text-on-surface">{formatPitDateRange(activeSummary)}</p>
                <p className="mt-2">
                  Outreach teams are currently gathering observations. Dashboard totals update as
                  the count is validated.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          {orderedSummaries.length ? (
            <div className="space-y-6">
              {orderedSummaries.map((summary) => (
                <PitCountRow key={summary.id} summary={summary} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] bg-surface-container-low px-6 py-6 text-sm leading-7 text-on-surface/74">
              Our first community point-in-time count is being finalized. Live data is available
              now and will continue to update as validation is completed.
            </div>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Method
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              What a PiT count is, and what it is not.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-on-surface/74">
            <p>
              A point-in-time count is a structured snapshot of everyone sleeping outdoors or in
              places not meant for housing on a given day. Outreach teams follow a standard route,
              invite people to answer a short set of questions, and publish only anonymized trend
              information.
            </p>
            <p>
              The IHARC workflow follows Canadian Observatory on Homelessness methodology, adapts it
              to Cobourg’s outreach routes, and suppresses any cell smaller than three responses to
              protect dignity and privacy.
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Published datasets
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              The public measures currently in rotation.
            </h2>
          </div>
          <div className="divide-y divide-outline/12 border-y border-outline/12">
            {datasets.map((dataset) => (
              <article key={dataset.title} className="grid gap-3 py-6 sm:grid-cols-[16rem_minmax(0,1fr)]">
                <h3 className="font-heading text-xl font-semibold">{dataset.title}</h3>
                <p className="text-sm leading-7 text-on-surface/74">{dataset.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface-container-low px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Privacy standard
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Accountability should not come at the cost of dignity.
              </h2>
            </div>
            <ul className="space-y-4">
              {dataPrinciples.map((principle) => (
                <li
                  key={principle}
                  className="border-t border-outline/12 pt-4 text-sm leading-7 text-on-surface/76 first:border-t-0 first:pt-0"
                >
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-6 border-t border-outline/12 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Secure analysis
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Need the secure operational view?
            </h2>
            <p className="text-sm leading-7 text-on-surface/74">
              STEVI provides role-based access to secure dashboards, follow-up detail, and deeper
              operational context for participating teams.
            </p>
          </div>
          <Link
            href={steviHomeUrl}
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            STEVI Login
          </Link>
        </section>
      </div>
    </div>
  );
}

function PitCountRow({ summary }: { summary: PitSummaryRow }) {
  const stats = [
    {
      label: 'Actively living outside',
      value: formatCount(summary.homelessness_confirmed_count ?? 0),
    },
    {
      label: 'Identified substance use or addictions',
      value: formatCount(summary.addiction_positive_count ?? 0),
    },
    {
      label: 'Severe mental health conditions',
      value: formatCount(summary.mental_health_positive_count ?? 0),
    },
  ];

  return (
    <article className="grid gap-6 border-b border-outline/12 pb-6 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.7fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h3 className="font-heading text-2xl font-semibold text-on-surface">
              {summary.title || 'Point-in-time outreach count'}
            </h3>
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface/60">
              {formatPitDateRange(summary)}
            </p>
          </div>
          <PitStatusBadge summary={summary} />
        </div>
        <p className="max-w-3xl text-sm leading-7 text-on-surface/74">
          {summary.description ??
            'Outreach teams gathered voluntary outdoor responses within Cobourg. Totals do not reflect Transition House shelter residents or people temporarily staying with friends or family.'}
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={`/data/pit/${summary.slug}`}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View full dashboard
          </Link>
          <span className="inline-flex min-h-11 items-center rounded-full border border-outline/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-on-surface/62">
            Updated {formatUpdatedTimestamp(summary.last_observation_at ?? summary.updated_at)}
          </span>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-on-surface/60">{stat.label}</dt>
            <dd className="mt-2 text-2xl font-semibold text-on-surface">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function formatUpdatedTimestamp(value: string | null): string {
  if (!value) return 'recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'recently';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}
