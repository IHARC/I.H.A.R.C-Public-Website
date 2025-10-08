import type { Metadata } from 'next';
import Link from 'next/link';

const commitments = [
  'Neighbours participate as storytellers and co-designers, not data points.',
  'Evidence is shared in plain language and updated as soon as partners publish it.',
  'Decisions acknowledge risks, mitigation steps, and who is accountable for action.',
  'Respectful moderation keeps stigmatizing or punitive ideas from moving forward.',
  'Frontline teams, municipal staff, and people with lived experience review plans together.',
];

const collaborationLoops = [
  {
    title: 'Listen and surface needs',
    description:
      'Street outreach, shelter teams, and neighbours flag urgent issues alongside the daily indicators. Moderators capture themes without publishing identifying information.',
  },
  {
    title: 'Co-design rapid responses',
    description:
      'Ideas move through a six-step submission that documents the problem, shared evidence, proposed changes, and respectful risk mitigation before a plan can launch.',
  },
  {
    title: 'Measure and adapt together',
    description:
      'Working Plans publish updates, decisions, and key dates so everyone can see what shifted, what needs support, and how to help in real time.',
  },
];

export const metadata: Metadata = {
  title: 'About IHARC — Inclusive Housing & Health Collaboration',
  description:
    'Learn how the Integrated Homelessness and Addictions Response Centre supports outreach today and how the IHARC Portal coordinates community-led crisis response with dignity.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">About IHARC</p>
        <h1 className="text-4xl font-bold tracking-tight">Collaboration built to honour neighbours first</h1>
        <p className="text-base text-on-surface/80">
          IHARC, the Integrated Homelessness and Addictions Response Centre, is a non-profit already delivering street outreach and wraparound supports with neighbours across Northumberland. The IHARC Portal extends that work by offering a transparent space where partners can organise crisis response, share evidence, and document next steps together.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {collaborationLoops.map((loop) => (
          <div key={loop.title} className="rounded-3xl border border-outline/20 bg-surface p-6">
            <h2 className="text-lg font-semibold text-on-surface">{loop.title}</h2>
            <p className="mt-2 text-sm text-on-surface/80">{loop.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What we commit to</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {commitments.map((commitment) => (
            <li key={commitment} className="rounded-2xl border border-outline/10 bg-surface-container p-4 text-sm text-on-surface/80">
              {commitment}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl border border-outline/10 bg-surface p-8">
        <h2 className="text-2xl font-semibold">Ready to collaborate?</h2>
        <p className="text-on-surface/80">
          Browse current proposals, add respectful evidence, or ask to be a community verifier. You only need an account to post or react—reading and sharing links stays open to everyone.
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href="/portal/ideas"
            className="rounded-full bg-primary px-5 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Explore proposals
          </Link>
          <Link
            href="/portal/plans"
            className="rounded-full border border-outline/30 px-5 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Track Working Plans
          </Link>
        </div>
      </section>
    </div>
  );
}
