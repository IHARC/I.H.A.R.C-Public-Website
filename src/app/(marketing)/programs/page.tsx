import type { Metadata } from 'next';

import { getProgramEntries } from '@/data/marketing-content';
import { buildMarketingMetadata } from '@/lib/site-metadata';

const supportModel = [
  {
    title: 'Outreach and trust-building',
    body: 'IHARC teams meet people where they are, respond to safety concerns, and create room for the next conversation.',
  },
  {
    title: 'Navigation and handoffs',
    body: 'We help people connect with housing, health, income, transportation, and partner supports without restarting from zero each time.',
  },
  {
    title: 'Shared follow-through',
    body: 'STEVI supports secure coordination for participating staff, volunteers, clients, and partner organizations once a support plan is underway.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMarketingMetadata({
    title: 'Programs & Collaborative Supports — IHARC',
    description:
      'Explore how the Integrated Homelessness and Addictions Response Centre coordinates outreach, service navigation, and secure follow-through with community partners.',
    path: '/programs',
  });
}

export default async function ProgramsPage() {
  const programAreas = await getProgramEntries();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <div className="space-y-16">
        <header className="grid gap-8 border-b border-outline/12 pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
          <div className="max-w-3xl space-y-5 text-balance">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Programs & Supports
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Coordinated support, not a maze of disconnected services.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              IHARC does not replace shelters, treatment programs, or housing providers. We help
              people access them faster, with clearer next steps and stronger follow-through across
              the organizations already doing the work.
            </p>
          </div>
          <div className="space-y-4 border-t border-outline/12 pt-6 text-sm leading-7 text-on-surface/72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p>
              This page explains the public-facing service model. Secure appointments, documents,
              and active support plans remain inside STEVI.
            </p>
            <p>
              Every program area below is funded, delivered, or coordinated in collaboration with
              multiple partners across Northumberland County.
            </p>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Service model
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              How IHARC creates continuity across the response.
            </h2>
          </div>
          <div className="divide-y divide-outline/12 border-y border-outline/12">
            {supportModel.map((item) => (
              <article key={item.title} className="grid gap-3 py-6 sm:grid-cols-[15rem_minmax(0,1fr)]">
                <h3 className="font-heading text-xl font-semibold">{item.title}</h3>
                <p className="text-sm leading-7 text-on-surface/74">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Current focus areas
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              The workstreams currently visible on the public site.
            </h2>
          </div>
          <div className="divide-y divide-outline/12 border-y border-outline/12">
            {programAreas.map((program) => (
              <article key={program.title} className="grid gap-4 py-6 lg:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.25fr)]">
                <h3 className="font-heading text-2xl font-semibold text-on-surface">
                  {program.title}
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-on-surface/74">
                  {program.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface-container-low px-6 py-8 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                What this means in practice
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Better coordination should feel simpler for the person receiving support.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-on-surface/74">
              <p>
                Public pages explain what IHARC is responsible for and where community members can
                find trusted information.
              </p>
              <p>
                STEVI handles the secure operational side: appointments, documents, progress notes,
                and role-based access for participating partners. That split keeps public
                communications clear while protecting privacy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
