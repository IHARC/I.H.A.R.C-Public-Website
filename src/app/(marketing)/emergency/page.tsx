import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'State of Emergency Brief — IHARC',
  description:
    'Understand why Northumberland partners declared a housing and overdose emergency, what the declaration enables, and how to share your support.',
};

const sections: Array<{
  id: string;
  title: string;
  body: string;
}> = [
  {
    id: 'what-it-is',
    title: 'What it is',
    body:
      'The declaration is a coordinated call for rapid housing and overdose supports. It commits partners to act together and to publish progress openly.',
  },
  {
    id: 'why-now',
    title: 'Why now',
    body:
      'Shelter capacity, street outreach reports, and emergency response data all show a rise in displacement and drug poisonings. Partners agree that current tools are not enough to keep neighbours safe.',
  },
  {
    id: 'what-it-enables',
    title: 'What it enables',
    body:
      'The declaration unlocks quicker purchasing of health and safety supplies, faster coordination of housing placements, and shared staffing for overdose response kits and pathways to treatment.',
  },
  {
    id: 'guardrails',
    title: 'Guardrails',
    body:
      'All actions must keep neighbours at the center. That means plain-language updates, anonymized data, community feedback loops, and transparent funding decisions. Enforcement-only actions are not advanced.',
  },
  {
    id: 'how-to-weigh-in',
    title: 'How to weigh in',
    body:
      'Review the detailed portal thread, add comments, and sign on if you agree. Moderators surface new ideas from these contributions and publish decisions along the way.',
  },
];

export default function EmergencyBriefPage() {
  return (
    <article className="mx-auto w-full max-w-4xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          State of Emergency Declaration
        </p>
        <h1 className="text-4xl font-bold tracking-tight">A coordinated response to keep neighbours safe</h1>
        <p className="text-lg text-on-surface/80">
          A declaration is a coordination tool. It accelerates staffing and procurement for housing and overdose response, and requires transparent progress reporting. It is not punitive. Actions are public, measured, and community-led.
        </p>
        <p className="text-base text-on-surface/80">
          This brief summarizes the shared evidence, commitments, and accountability measures supporting the declaration.
        </p>
      </header>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-3 text-balance">
            <h2 className="text-2xl font-semibold">{section.title}</h2>
            <p className="text-base text-on-surface/80">{section.body}</p>
          </section>
        ))}
      </div>

      <footer className="space-y-4 rounded-3xl border border-outline/20 bg-surface p-8">
        <h2 className="text-2xl font-semibold">Keep the momentum going</h2>
        <p className="text-on-surface/80">
          Endorse the declaration and add feedback inside the collaboration portal. Moderators capture every comment and log next steps.
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={siteConfig.emergency.supportHref}
            className="rounded-full bg-primary px-6 py-3 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Endorse the declaration
          </Link>
          <Link
            href="/portal/ideas/submit"
            className="rounded-full border border-outline/30 px-6 py-3 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Provide feedback or propose an idea
          </Link>
        </div>
      </footer>
    </article>
  );
}
