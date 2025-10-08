import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Hero } from '@/components/site/Hero';
import { ContextCards } from '@/components/site/ContextCards';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'IHARC — Integrated Homelessness and Addictions Response Centre',
  description:
    'Discover how the Integrated Homelessness and Addictions Response Centre supports neighbours across Northumberland and how the IHARC Portal coordinates urgent housing and overdose response.',
};

export default function MarketingHomePage() {
  return (
    <div className="space-y-20 pb-16">
      <Hero />

      <section className="space-y-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-balance">
          <h2 className="text-3xl font-semibold text-on-surface">How we got here</h2>
          <p className="max-w-3xl text-on-surface/80">
            Community members asked for one shared picture of what is happening. These focus areas ground the work happening inside the collaboration portal.
          </p>
        </div>
        <ContextCards />
      </section>

      <section className="bg-surface-container py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 text-balance md:flex-row md:items-center md:justify-between md:gap-12">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Stay involved</h2>
            <p className="mt-2 max-w-xl text-on-surface/80">
              Join neighbours, agencies, and Town staff in shaping rapid responses. Every proposal includes evidence, community support, and clear accountability notes.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:max-w-2xl md:max-w-none md:grid-cols-2">
            <StayInvolvedLink href="/portal/ideas" label="Propose a solution">
              Document the problem, evidence, and metrics so moderators can advance it.
            </StayInvolvedLink>
            <StayInvolvedLink href="/portal/ideas?sort=top" label="Comment and react to ideas">
              Share respectful feedback and support proposals that align with community care.
            </StayInvolvedLink>
            <StayInvolvedLink href="/portal/plans" label="Track plan progress">
              Follow Working Plans, decision notes, and key dates in one place.
            </StayInvolvedLink>
            <StayInvolvedLink href={siteConfig.emergency.supportHref} label="Support the declaration">
              Add your name to the community petition. It is a public show of support, not a legal referendum.
            </StayInvolvedLink>
          </div>
        </div>
      </section>

      <section id="help" className="mx-auto w-full max-w-6xl space-y-6 px-4">
        <h2 className="text-3xl font-semibold text-on-surface">Need support right now?</h2>
        <p className="max-w-3xl text-on-surface/80">
          Reach out to partners offering housing navigation, overdose response, and compassionate crisis support. Moderators keep this list current.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <HelpCard
            title="Shelter placement and warming sites"
            description={
              <>
                Call <Link href="tel:211" className="text-primary underline">2-1-1</Link> or{' '}
                <Link href="tel:19053723831" className="text-primary underline">905-372-3831</Link>.
              </>
            }
          />
          <HelpCard
            title="Overdose response and essential health supplies"
            description={
              <>
                Text <Link href="tel:19053769898" className="text-primary underline">905-376-9898</Link> or email{' '}
                <Link href="mailto:outreach@iharc.ca" className="text-primary underline">outreach@iharc.ca</Link>.
              </>
            }
          />
          <HelpCard
            title="Mental health crisis support"
            description={
              <>
                Call <Link href="tel:19053721280" className="text-primary underline">905-372-1280 ext. 2410</Link> (24/7).
              </>
            }
          />
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
  return (
    <Link
      href={href}
      className="group flex h-full w-full flex-col rounded-3xl border border-outline/30 bg-surface px-6 py-5 text-left text-sm transition hover:border-outline hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container sm:text-base md:px-7"
    >
      <span className="block font-semibold text-on-surface">{label}</span>
      <span className="mt-2 block text-on-surface-variant">{children}</span>
    </Link>
  );
}

type HelpCardProps = {
  title: string;
  description: ReactNode;
};

function HelpCard({ title, description }: HelpCardProps) {
  return (
    <div className="rounded-3xl border border-outline/20 bg-surface p-6">
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 text-sm text-on-surface/80">{description}</p>
    </div>
  );
}
