import type { Metadata } from 'next';
import Link from 'next/link';

import { formatCount, formatPitDateRange, isPitCountInProgress, sortSummariesByWindow } from '@/lib/pit/public';
import { getPitPublicDataset } from '@/data/pit';
import type { PitSummaryRow } from '@/lib/pit/public';

const datasets = [
  {
    title: 'Daily housing indicators',
    description:
      'Shelter occupancy, motel overflow usage, and the number of people recorded outdoors or in encampments. Updated by County housing staff with on-call validation from outreach teams.',
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
    'Understand which housing and overdose response indicators feed the IHARC Portal and how residents can request new metrics.',
  alternates: {
    canonical: '/data',
  },
  openGraph: {
    type: 'website',
    title: 'Community Data & Metrics — IHARC',
    description:
      'Understand which housing and overdose response indicators feed the IHARC Portal and how residents can request new metrics.',
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
      'Understand which housing and overdose response indicators feed the IHARC Portal and how residents can request new metrics.',
    images: ['/logo.png'],
  },
};

export const dynamic = 'force-dynamic';

export default async function DataPage() {
  const { summaries } = await getPitPublicDataset();

  const orderedSummaries = sortSummariesByWindow(summaries).reverse();
  const activeSummary = orderedSummaries.find((summary) => isPitCountInProgress(summary));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community Data</p>
        <h1 className="text-4xl font-bold tracking-tight">Metrics that keep the response accountable</h1>
        <p className="text-base text-on-surface/80">
          IHARC shares the data people asked for most often. Each dataset is stewarded by a public agency or trusted partner, and every chart links back to the responsible team so you can ask questions or suggest new measures.
        </p>
        <p className="text-sm text-on-surface/70">
          We timestamp every update and link to the stewarding team so you always know who published the numbers and when.
        </p>
      </header>

      <section className="space-y-6">
        <header className="space-y-3 text-balance">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Point-in-Time Outreach</p>
          <h2 className="text-3xl font-semibold text-on-surface">Latest community counts</h2>
          <p className="text-sm text-on-surface-variant">
            IHARC and volunteers are collecting data on who is sleeping outdoors right now and what supports feel safe. Counts do not include Transition House shelter residents or people couch surfing or doubling up with friends. Everything published here is anonymised trend data.
          </p>
          <p className="text-sm font-semibold text-error">
            In an emergency call 911. The Good Samaritan Drug Overdose Act protects the caller and the person experiencing an overdose.
          </p>
          <p className="text-sm text-on-surface-variant">
            Need help between? Email <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a> or visit the RAAM clinic on Tuesdays, 12–3 pm at 1011 Elgin St. W.
          </p>
        </header>

        {orderedSummaries.length ? (
          <div className="grid gap-6">
            {orderedSummaries.map((summary) => (
              <PitCountCard key={summary.id} summary={summary} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-sm text-on-surface-variant">
            Our first community point-in-time count is being finalised. Live data is available now. Please note, data is still being updated and changes are likely. 
          </div>
        )}
      </section>

      {activeSummary ? (
        <aside className="rounded-3xl border border-outline/10 bg-surface-container p-6 text-sm text-on-surface-variant">
          <p className="font-semibold text-on-surface">Active count</p>
          <p className="mt-1 text-on-surface">{formatPitDateRange(activeSummary)}</p>
          <p className="mt-2">
            We are currently gathering observations. Live charts update every few minutes—follow along on the detailed page.
          </p>
        </aside>
      ) : null}

      <section className="space-y-4 rounded-3xl border border-outline/10 bg-surface p-8">
        <h2 className="text-2xl font-semibold text-on-surface">What is a PiT count?</h2>
        <p className="text-sm text-on-surface-variant">
          A point-in-time (PiT) count is a structured snapshot of everyone sleeping outdoors or in places not meant for housing on a given day. Outreach teams follow a standardised route, ask each person a short set of questions about housing status, health and safety concerns, and treatment interest, and log responses anonymously. The data helps provide public insight into the current trends and can help guide the creation of new solutions that address the actual needs. Because a PiT is a single moment, it does not replace ongoing case work or daily outreach notes—it simply gives the community a shared baseline for rapid planning.
        </p>
        <p className="text-sm text-on-surface-variant">
          The IHARC PiT workflow follows the Canadian Observatory on Homelessness methodology, adapts it for Cobourg’s outreach routes, and suppresses any cell smaller than three responses to protect dignity and privacy.
        </p>
      </section>

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
          The portal&apos;s Progress view summarises the last 30 days. For deeper analysis, partners can request access to the underlying tables through the moderation team.
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

function PitCountCard({ summary }: { summary: PitSummaryRow }) {
  const stats = [
    {
      label: 'Actively living outside',
      value: formatCount(summary.homelessness_confirmed_count || 0),
    },
    {
      label: 'Identified substance use / addictions',
      value: formatCount(summary.addiction_positive_count),
    },
    {
      label: 'Severe mental health conditions',
      value: formatCount(summary.mental_health_positive_count),
    },
  ];

  return (
    <article className="space-y-5 rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-xl space-y-2">
        <h3 className="text-xl font-semibold text-on-surface">{summary.title || 'Point-in-time outreach count'}</h3>
        <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">{formatPitDateRange(summary)}</p>
        <p className="text-sm text-on-surface-variant">
          {summary.description ??
            'Outreach teams gathered voluntary outdoor responses within Cobourg. Totals do not reflect Transition House shelter residents or people temporarily staying with friends or family.'}
        </p>
      </div>
        <span
          className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold ${
            isPitCountInProgress(summary)
              ? 'bg-primary/10 text-primary'
              : 'bg-outline/10 text-on-surface-variant'
          }`}
        >
          {isPitCountInProgress(summary) ? 'In Progress' : 'Completed'}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
            <dt className="text-xs uppercase tracking-wide text-on-surface-variant">{stat.label}</dt>
            <dd className="mt-2 text-lg font-semibold text-on-surface">
              {stat.value}
              {stat.hint ? <span className="ml-2 text-xs font-normal text-on-surface-variant">{stat.hint}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/data/pit/${summary.slug}`}
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          View full dashboard
        </Link>
        <span className="inline-flex items-center rounded-full border border-outline/30 px-4 py-2 text-xs text-on-surface-variant">
          Updated {formatUpdatedTimestamp(summary.last_observation_at ?? summary.updated_at)}
        </span>
      </div>
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
