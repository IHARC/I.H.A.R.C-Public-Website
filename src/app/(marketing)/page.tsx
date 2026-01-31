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
    <div className="space-y-20 pb-16">
      <Hero content={heroContent} />

      <section id="help" className="mx-auto w-full max-w-7xl space-y-6 px-4">
        <div className="flex flex-col gap-3 text-balance">
          <h2 className="type-headline-medium text-on-surface">Need support right now?</h2>
          <p className="max-w-3xl type-body-large text-on-surface/80">
            Reach out to partners offering housing navigation, overdose response, and compassionate crisis support.
            Moderators keep this list current.
          </p>
          <div>
            <Link
              href="/get-help"
              className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Get help
            </Link>
          </div>
        </div>
        <CrisisNotice variant="card" />
        <div className="grid gap-4 md:grid-cols-3">
          {urgentSupports.map((support) => (
            <HelpCard key={support.title} support={support} />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 text-balance">
          <h2 className="type-headline-medium text-on-surface">How we got here</h2>
          <p className="max-w-3xl type-body-large text-on-surface/80">
            Community members asked for one shared picture of what is happening. These focus areas now guide the support plans inside STEVI, the secure IHARC portal used by clients and outreach partners—not a public forum.
          </p>
        </div>
        <ContextCards topics={contextCards} />
      </section>

      <section className="bg-surface-container py-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 text-balance md:flex-row md:items-center md:justify-between md:gap-12">
          <div>
            <h2 className="type-title-large text-on-surface">Stay involved</h2>
            <p className="mt-2 max-w-xl type-body-large text-on-surface/80">
              This site shares public data while STEVI keeps IHARC&apos;s clients and staff connected. If you&apos;re already
              working with IHARC, STEVI is the secure portal for updates, documents, and outreach coordination.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:max-w-2xl md:max-w-none md:grid-cols-2">
            <StayInvolvedLink href={steviHomeUrl} label="Sign in to STEVI">
              Review your IHARC plan, appointments, secure documents, and outreach updates.
            </StayInvolvedLink>
            <StayInvolvedLink href={steviRegisterUrl} label="Request STEVI access">
              Working with IHARC? Request credentials so we can coordinate care in one place.
            </StayInvolvedLink>
            <StayInvolvedLink href="/data" label="Explore live data">
              Supabase-powered stats keep neighbours informed about shelter, overdose, and outreach trends.
            </StayInvolvedLink>
          </div>
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
      className="group flex h-full w-full flex-col rounded-[var(--md-sys-shape-corner-large)] border border-outline/30 bg-surface px-6 py-5 text-left text-sm transition hover:bg-primary/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container sm:text-base md:px-7"
    >
      <span className="block font-semibold text-on-surface">{label}</span>
      <span className="mt-2 block text-on-surface-variant type-body-medium">{children}</span>
    </Link>
  );
}

type HelpCardProps = {
  support: Awaited<ReturnType<typeof getSupportEntries>>['urgent'][number];
};

function HelpCard({ support }: HelpCardProps) {
  return (
    <div className="rounded-[var(--md-sys-shape-corner-large)] border border-outline/20 bg-surface p-6 shadow-sm">
      <h3 className="type-title-medium text-on-surface">{support.title}</h3>
      <p className="mt-2 type-body-medium text-on-surface/80">{support.summary}</p>
      <ul className="mt-3 space-y-1 text-sm font-semibold text-primary">
        {support.contacts.map((contact) =>
          contact.href ? (
            <li key={`${support.title}-${contact.label}`}>
              <Link href={contact.href} className="underline">
                {contact.label}
              </Link>
            </li>
          ) : (
            <li key={`${support.title}-${contact.label}`}>{contact.label}</li>
          ),
        )}
      </ul>
    </div>
  );
}
