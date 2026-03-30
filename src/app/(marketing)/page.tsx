import type { ReactNode } from 'react';
import Link from 'next/link';
import { Hero } from '@/components/site/Hero';
import { ContextCards } from '@/components/site/ContextCards';
import { CrisisNotice } from '@/components/site/CrisisNotice';
import { getContextCards, getHeroContent, getSupportEntries } from '@/data/marketing-content';
import { steviPortalUrl } from '@/lib/stevi-portal';

export default async function MarketingHomePage() {
  const [heroContent, contextCards, supports] = await Promise.all([
    getHeroContent(),
    getContextCards(),
    getSupportEntries(),
  ]);
  const steviHomeUrl = steviPortalUrl('/');
  const steviRegisterUrl = steviPortalUrl('/register');
  const urgentSupports = supports.urgent;

  return (
    <div className="bg-background pb-20">
      <Hero content={heroContent} />

      <section id="help" className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:px-6 lg:py-20">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Get help first</p>
            <h2 className="font-heading text-4xl font-semibold leading-tight tracking-[-0.03em] text-on-surface text-balance sm:text-5xl">
              Find urgent support fast without sorting through a crowded homepage.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              IHARC keeps verified housing, overdose, and crisis contacts visible in one place. The public site stays
              readable under pressure, and STEVI stays reserved for secure coordination after someone is already
              connected.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/get-help"
              className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-[0_12px_30px_rgba(207,18,63,0.24)] transition hover:bg-primary/92 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open Get Help
            </Link>
            <Link
              href="/resources"
              className="inline-flex min-h-12 items-center rounded-full border border-outline/30 px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse public resources
            </Link>
          </div>

          <CrisisNotice variant="card" />
        </div>

        <div className="space-y-4">
          {urgentSupports.map((support, index) => (
            <SupportRow key={support.title} support={support} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-outline/12 bg-surface-container-low">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:px-6 lg:py-20">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">How IHARC works differently</p>
            <h2 className="font-heading text-4xl font-semibold leading-tight tracking-[-0.03em] text-on-surface text-balance sm:text-5xl">
              Public accountability up front. Secure coordination only when it matters.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              IHARC is not another closed program microsite. The public side explains the local reality, shows what is
              changing, and makes it easier to find support. Confidential planning, updates, and documents move into
              STEVI once someone is actively working with outreach teams.
            </p>
          </div>
          <ContextCards topics={contextCards} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:px-6 lg:py-20">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Stay involved</p>
          <h2 className="font-heading text-4xl font-semibold leading-tight tracking-[-0.03em] text-on-surface text-balance sm:text-5xl">
            Follow the public work here. Move into STEVI only when you need secure coordination.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
            Community members can track updates, transparency, and public data without logging in. Clients, outreach
            staff, volunteers, and partners use STEVI when the work becomes personal, scheduled, or document-based.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StayInvolvedLink href={steviHomeUrl} label="STEVI Login">
            Open the secure workspace for appointments, documents, and active outreach coordination.
          </StayInvolvedLink>
          <StayInvolvedLink href={steviRegisterUrl} label="Request STEVI access">
            Request secure access only if you are already working directly with IHARC or an approved partner team.
          </StayInvolvedLink>
          <StayInvolvedLink href="/data" label="Explore live data">
            Review public trends tied to housing pressure, overdose response, and service coordination.
          </StayInvolvedLink>
          <StayInvolvedLink href="/updates" label="Read field updates">
            Follow the latest reporting on response work, operating changes, and community-facing progress.
          </StayInvolvedLink>
        </div>
      </section>
    </div>
  );
}

type StayInvolvedLinkProps = {
  href: string;
  label: string;
  children: ReactNode;
};

function StayInvolvedLink({ href, label, children }: StayInvolvedLinkProps) {
  const isExternal = /^https?:\/\//.test(href);

  return (
    <Link
      href={href}
      prefetch={!isExternal}
      rel={isExternal ? 'noreferrer' : undefined}
      className="group flex h-full flex-col justify-between rounded-[2rem] border border-outline/15 bg-surface px-6 py-6 text-left transition hover:border-primary/25 hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="block font-heading text-2xl font-semibold tracking-[-0.03em] text-on-surface">{label}</span>
      <span className="mt-3 block text-base leading-7 text-on-surface/74">{children}</span>
      <span className="mt-6 inline-flex items-center text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        Continue
        <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}

type SupportRowProps = {
  support: Awaited<ReturnType<typeof getSupportEntries>>['urgent'][number];
  index: number;
};

function SupportRow({ support, index }: SupportRowProps) {
  return (
    <article className="border-t border-outline/15 pt-6 first:border-t-0 first:pt-0">
      <div className="grid gap-4 md:grid-cols-[5rem_minmax(0,1fr)_minmax(14rem,18rem)] md:items-start">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/72">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="space-y-3">
          <h3 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-on-surface text-balance">
            {support.title}
          </h3>
          <p className="max-w-2xl text-base leading-7 text-on-surface/78">{support.summary}</p>
        </div>
        <ul className="space-y-2 text-sm font-semibold text-primary">
          {support.contacts.map((contact) =>
            contact.href ? (
              <li key={`${support.title}-${contact.label}`}>
                <Link
                  href={contact.href}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-outline/20 px-4 py-2 underline-offset-4 transition hover:border-primary/30 hover:bg-primary/6 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {contact.label}
                </Link>
              </li>
            ) : (
              <li key={`${support.title}-${contact.label}`} className="text-on-surface/74">
                {contact.label}
              </li>
            ),
          )}
        </ul>
      </div>
    </article>
  );
}
