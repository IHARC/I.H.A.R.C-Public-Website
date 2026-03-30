import type { Metadata } from 'next';
import Link from 'next/link';

import { buildMarketingMetadata } from '@/lib/site-metadata';
import { steviPortalUrl } from '@/lib/stevi-portal';

const commitments = [
  'Neighbours shape decisions through lived experience, consented feedback, and direct review.',
  'Evidence is published in plain language so the public record stays understandable.',
  'Every public commitment has an accountable owner, next step, and follow-through trail.',
  'Privacy is protected by design. Public pages never expose client identities or case activity.',
  'Technology is used to shorten handoffs, not to replace frontline relationships.',
];

const collaborationLoops = [
  {
    title: 'Reach people earlier',
    description:
      'Street outreach, wellness checks, and immediate safety follow-up help IHARC identify needs before they become more acute.',
  },
  {
    title: 'Coordinate the next step',
    description:
      'IHARC works with housing, health, and community partners to connect people to the right support instead of leaving them to repeat their story.',
  },
  {
    title: 'Keep follow-through visible',
    description:
      'STEVI gives participating staff, volunteers, and clients a secure shared view of appointments, documents, and what changed next.',
  },
];

const operatingPrinciples = [
  {
    title: 'Frontline first',
    body: 'The response starts with outreach, trust, and immediate needs. Technology supports that work behind the scenes.',
  },
  {
    title: 'Built for coordination',
    body: 'IHARC is designed to reduce dropped handoffs between organizations by keeping the secure operational record in one place.',
  },
  {
    title: 'Public by default, private when required',
    body: 'Community updates, metrics, and policies are published here. Client-specific workflows stay inside STEVI.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMarketingMetadata({
    title: 'About IHARC — Integrated Homelessness and Addictions Response Centre',
    description:
      'Learn how the Integrated Homelessness and Addictions Response Centre coordinates frontline outreach across Northumberland County and how STEVI supports secure follow-through.',
    path: '/about',
  });
}

export default function AboutPage() {
  const steviHomeUrl = steviPortalUrl('/');
  const steviRegisterUrl = steviPortalUrl('/register');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <div className="space-y-16">
        <header className="grid gap-8 border-b border-outline/12 pb-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end">
          <div className="max-w-3xl space-y-5 text-balance">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">About IHARC</p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              A coordinated public response for homelessness, addiction, and follow-through.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              The Integrated Homelessness and Addictions Response Centre works across
              Northumberland County to connect people with outreach, navigation, and practical next
              steps. IHARC is not a shelter or treatment provider. We coordinate the response around
              those services so fewer people get lost between them.
            </p>
          </div>
          <div className="grid gap-4 border-t border-outline/12 pt-6 text-sm text-on-surface/70 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
                Public role
              </p>
              <p className="mt-2 leading-7">
                Explain the model, publish updates, and show how IHARC is improving access and
                accountability.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
                Secure role
              </p>
              <p className="mt-2 leading-7">
                STEVI is the secure workspace for clients, outreach staff, volunteers, and partner
                organizations to manage appointments, documents, and follow-up.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              How the model works
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              A tech-enabled service model that stays grounded in frontline care.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-on-surface/72">
              IHARC uses shared coordination, current public reporting, and a secure operational
              workspace to make outreach more consistent. The goal is not more paperwork. The goal
              is fewer missed steps for people who already face enough barriers.
            </p>
          </div>
          <div className="divide-y divide-outline/12 border-y border-outline/12">
            {collaborationLoops.map((loop) => (
              <article key={loop.title} className="grid gap-3 py-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <h3 className="font-heading text-xl font-semibold text-on-surface">{loop.title}</h3>
                <p className="text-sm leading-7 text-on-surface/74">{loop.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-[2rem] bg-surface-container-low px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Operating principles
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              The public standard we hold ourselves to.
            </h2>
          </div>
          <div className="space-y-5">
            {operatingPrinciples.map((principle) => (
              <div key={principle.title} className="border-t border-outline/12 pt-5 first:border-t-0 first:pt-0">
                <h3 className="font-heading text-xl font-semibold">{principle.title}</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface/74">{principle.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Commitments
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              What people should expect from IHARC.
            </h2>
          </div>
          <ul className="space-y-4">
            {commitments.map((commitment) => (
              <li
                key={commitment}
                className="border-t border-outline/12 pt-4 text-sm leading-7 text-on-surface/76 first:border-t-0 first:pt-0"
              >
                {commitment}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 border-t border-outline/12 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Secure coordination
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Already working with IHARC or a partner team?
            </h2>
            <p className="text-sm leading-7 text-on-surface/74">
              Sign in to STEVI to review appointments, documents, and follow-up tasks. If you are
              supporting someone through IHARC and need access, request it through the secure
              onboarding flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href={steviHomeUrl}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              STEVI Login
            </Link>
            <Link
              href={steviRegisterUrl}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-full border border-outline/25 px-5 py-2.5 text-on-surface transition hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Request STEVI access
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
