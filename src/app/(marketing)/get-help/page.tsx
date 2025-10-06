import type { Metadata } from 'next';
import Link from 'next/link';

const urgentSupports = [
  {
    title: 'Shelter placement & warming sites',
    description:
      'Call 2-1-1 or the County housing help centre. Staff and outreach teams coordinate transportation, motel overflow, and on-call wellness checks.',
    contact: 'Dial 2-1-1 or 905-372-3831',
  },
  {
    title: 'Overdose prevention & safer supply',
    description:
      'Mobile teams and peer responders share naloxone, safer-use supplies, and connect people to primary care without police involvement.',
    contact: 'Text 905-376-9898 or email outreach@iharc.ca',
  },
  {
    title: 'Mental health crisis support',
    description:
      'Community counsellors and harm reduction workers respond together. Supports can be anonymous; follow-up is coordinated only with consent.',
    contact: 'Call 905-372-1280 ext. 2410 (24/7)',
  },
];

const mutualAid = [
  'Cobourg Mutual Aid: direct outreach, supplies, and accompaniment for appointments.',
  'Northumberland Paramedics: wellness checks and overdose post-response follow-up teams.',
  'Local Indigenous partners hosting weekly circles focused on cultural safety and belonging.',
];

export const metadata: Metadata = {
  title: 'Get Help Now — IHARC',
  description:
    'Find immediate housing, health, and overdose prevention supports across Northumberland County. Contact information is provided without collecting personal data.',
};

export default function GetHelpPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Get Help Now</p>
        <h1 className="text-4xl font-bold tracking-tight">Support is coordinated, compassionate, and available</h1>
        <p className="text-base text-on-surface/80">
          No one using this list needs to share personal details publicly. Contact teams directly and let them know how to reach you safely. Moderators refresh this page whenever hours or contacts change.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {urgentSupports.map((support) => (
          <article key={support.title} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface">{support.title}</h2>
            <p className="mt-2 text-sm text-on-surface/80">{support.description}</p>
            <p className="mt-4 text-sm font-semibold text-primary">{support.contact}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-outline/20 bg-surface-container p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Community-led mutual aid</h2>
        <ul className="mt-4 space-y-3">
          {mutualAid.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4">
          Want to add a community resource? Email
          {' '}
          <Link href="mailto:portal@iharc.ca" className="font-semibold text-primary underline">
            portal@iharc.ca
          </Link>
          {' '}with details and we will follow up within one business day.
        </p>
      </section>

      <section className="rounded-3xl border border-outline/10 bg-surface p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">When to use the portal</h2>
        <p className="mt-2">
          If you see a pattern that needs a coordinated response—like repeated evictions, encampments facing enforcement, or increased overdose calls—propose an idea in the portal. Moderators will help gather evidence and loop in the right partners.
        </p>
        <Link
          href="/portal/ideas/submit"
          className="mt-4 inline-flex w-fit rounded-full border border-outline/30 px-5 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Share a community idea
        </Link>
      </section>
    </div>
  );
}
