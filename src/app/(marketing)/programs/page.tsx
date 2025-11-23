import type { Metadata } from 'next';
import { getProgramEntries } from '@/data/marketing-content';

export const metadata: Metadata = {
  title: 'Programs & Collaborative Supports — IHARC',
  description:
    'Explore how Integrated Homelessness and Addictions Response Centre partners coordinate across outreach, shelter, and overdose prevention through the STEVI portal.',
  alternates: {
    canonical: '/programs',
  },
  openGraph: {
    type: 'website',
    title: 'Programs & Collaborative Supports — IHARC',
    description:
      'Explore how Integrated Homelessness and Addictions Response Centre partners coordinate across outreach, shelter, and overdose prevention through the STEVI portal.',
    url: '/programs',
    images: [
      {
        url: '/logo.png',
        alt: 'IHARC — Integrated Homelessness and Addictions Response Centre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Programs & Collaborative Supports — IHARC',
    description:
      'Explore how Integrated Homelessness and Addictions Response Centre partners coordinate across outreach, shelter, and overdose prevention through the STEVI portal.',
    images: ['/logo.png'],
  },
};

export default async function ProgramsPage() {
  const programAreas = await getProgramEntries();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Programs & Supports</p>
        <h1 className="text-4xl font-bold tracking-tight">Community teams coordinating through STEVI</h1>
        <p className="text-base text-on-surface/80">
          IHARC does not replace frontline programs—it gives them a shared STEVI workspace to stay organized. These focus areas describe how partners use STEVI to move faster, close gaps, and honour lived experience.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {programAreas.map((program) => (
          <article key={program.title} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface">{program.title}</h2>
            <p className="mt-3 text-sm text-on-surface/80">{program.description}</p>
          </article>
        ))}
      </section>

      <aside className="rounded-3xl border border-outline/20 bg-surface-container p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Need details on a specific project?</h2>
        <p className="mt-2">
          Working Plans include responsible partners, key dates, and how the community can help. Plans are updated directly in STEVI so outreach staff and clients always see the most recent commitments.
        </p>
      </aside>
    </div>
  );
}
