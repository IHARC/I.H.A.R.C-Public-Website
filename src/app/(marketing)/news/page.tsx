import type { Metadata } from 'next';
import Link from 'next/link';

const updates = [
  {
    title: 'Weekly collaboration digest',
    date: 'Every Monday',
    summary:
      'Moderators publish a roundup of new ideas, Working Plan updates, and urgent metrics shifts. Subscribe to stay in the loop without logging in daily.',
  },
  {
    title: 'Emergency declaration briefing',
    date: 'Updated as council decisions land',
    summary:
      'We document how Cobourg and County partners are acting on the State of Emergency call, including staffing, procurement shifts, and public accountability steps.',
  },
  {
    title: 'Community debrief sessions',
    date: 'Next session: Last Thursday of the month',
    summary:
      'Neighbours, agencies, and municipal staff review progress together. Notes and action items are posted in the portal immediately after each session.',
  },
];

export const metadata: Metadata = {
  title: 'News & Updates — IHARC',
  description:
    'Stay current with IHARC announcements, council updates, and collaboration digests focused on housing stability and overdose response.',
};

export default function NewsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">News & Updates</p>
        <h1 className="text-4xl font-bold tracking-tight">Follow the collaborative work in real time</h1>
        <p className="text-base text-on-surface/80">
          IHARC keeps announcements brief and action-oriented. Each update links back to the portal so you can see the evidence, discussion, and decisions behind the headline.
        </p>
      </header>

      <section className="space-y-4">
        {updates.map((update) => (
          <article key={update.title} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-on-surface">{update.title}</h2>
              <span className="text-sm font-medium uppercase tracking-wide text-on-surface/60">{update.date}</span>
            </div>
            <p className="mt-3 text-sm text-on-surface/80">{update.summary}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-outline/20 bg-surface-container p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Want a deeper dive?</h2>
        <p className="mt-2">
          The portal records every Working Plan update, decision, and metric adjustment. Subscribe inside the portal to receive notifications or export public RSS feeds.
        </p>
        <Link
          href="/portal/plans"
          className="mt-4 inline-flex w-fit rounded-full bg-primary px-5 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Browse Working Plans
        </Link>
      </section>
    </div>
  );
}
