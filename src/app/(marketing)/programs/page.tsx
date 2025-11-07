import type { Metadata } from 'next';

const programAreas = [
  {
    title: 'Street Outreach',
    description:
      'Multi-agency teams share health and safety supplies, coordinate warm hand-offs to housing support, and check in on wellness goals neighbours set for themselves.',
  },
  {
    title: 'Shelter & Stabilization',
    description:
      'Housing staff navigate intake, coordinate hotel overflow when shelters are full, and aim to publish near real-time availability wherever partners share data.',
  },
  {
    title: 'Overdose Prevention',
    description:
      'Peer responders and health partners align kit distribution, CPR refreshers, and post-overdose follow-up so nobody is left alone after a poisoning.',
  },
  {
    title: 'Community Safety',
    description:
      'Neighbours, business owners, and by-law collaborate on compassionate stewardship—clean-ups, sharps disposal, and addressing safety concerns without displacement.',
  },
  {
    title: 'Systems Navigation',
    description:
      'Support workers help people replace lost ID, access income supports, and connect to trauma-informed health care while reducing paperwork duplication.',
  },
  {
    title: 'Learning & Evaluation',
    description:
      'Partners share what is working, where the data has gaps, and how to adjust supports quickly. Each Working Plan lists the metrics community members want to see.',
  },
];

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

export default function ProgramsPage() {
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
