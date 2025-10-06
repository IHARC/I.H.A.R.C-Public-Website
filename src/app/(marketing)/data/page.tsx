import type { Metadata } from 'next';
import Link from 'next/link';

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
      'Each Working Plan publishes the measures community members chose—like safe supply referrals completed, units secured, or outreach shifts added—so progress stays transparent.',
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
    'Understand which housing and overdose response indicators feed the IHARC Command Center and how neighbours can request new metrics.',
};

export default function DataPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community Data</p>
        <h1 className="text-4xl font-bold tracking-tight">Metrics that keep the response accountable</h1>
        <p className="text-base text-on-surface/80">
          IHARC shares the data neighbours asked for most often. Each dataset is stewarded by a public agency or trusted partner, and every chart links back to the responsible team so you can ask questions or suggest new measures.
        </p>
      </header>

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
