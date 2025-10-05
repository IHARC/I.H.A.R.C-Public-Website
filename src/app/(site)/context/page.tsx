import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Context for Collaboration — IHARC',
  description:
    'Read the shared context behind IHARC’s focus areas: housing shortage, toxic drug supply, justice churn, and fragmented support.',
};

const sections: Array<{
  id: string;
  title: string;
  description: string;
  points: string[];
}> = [
  {
    id: 'housing',
    title: 'Housing shortage',
    description:
      'Market rents climbed faster than wages and income assistance. Vacancy rates stay near zero, so neighbours without savings face repeated displacement.',
    points: [
      'Shelters run at or near capacity through most weeks of the year.',
      'Landlords and service providers report long waits for supportive housing.',
      'Without stable housing, health and employment plans stall.',
    ],
  },
  {
    id: 'supply',
    title: 'Toxic drug supply',
    description:
      'Unregulated street supply now includes unpredictable combinations of opioids, stimulants, and benzodiazepines. This drives high overdose risk.',
    points: [
      'Health partners distribute health and safety supplies, overdose response kits, and pathways to treatment every day.',
      'Drug checking and monitoring data confirm wide swings in potency and mixing.',
      'People who use drugs report barriers to safe supply and evidence-based treatment.',
    ],
  },
  {
    id: 'justice',
    title: 'Justice churn',
    description:
      'Frequent cycles through courts, remand, or custody interrupt health care, case management, and housing stabilization.',
    points: [
      'Release planning often happens with short notice, making it hard to align housing supports.',
      'People miss health appointments or treatment intakes while navigating conditions.',
      'Community partners must rebuild trust with each return to the street.',
    ],
  },
  {
    id: 'support',
    title: 'Fragmented support',
    description:
      'Neighbourhood-level outreach, municipal services, and provincial programs do not always share data or workflows, leaving gaps in care.',
    points: [
      'Families and neighbours struggle to know who to call for each issue.',
      'Agency staff manage separate reporting systems that slow down response.',
      'Transport and rural distance make it harder to reach help quickly.',
    ],
  },
];

export default function ContextPage() {
  return (
    <article className="mx-auto w-full max-w-4xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Shared context</p>
        <h1 className="text-4xl font-bold tracking-tight">Why IHARC focuses on these four areas</h1>
        <p className="text-lg text-on-surface/80">
          These notes summarize what neighbours, outreach teams, and partner agencies surfaced while building the collaboration portal.
        </p>
      </header>

      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-4 text-balance">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">{section.title}</h2>
              <p className="text-base text-on-surface/80">{section.description}</p>
            </div>
            <ul className="space-y-2 text-base text-on-surface/70">
              {section.points.map((point) => (
                <li key={point} className="rounded-xl bg-surface-container p-4">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
