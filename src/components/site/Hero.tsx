'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { HeroContent } from '@/data/marketing-content';

type HeroProps = {
  content: HeroContent;
};

export function Hero({ content }: HeroProps) {
  const { pill, headline, body, supporting, primaryCta, secondaryLink } = content;
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-6 text-balance">
        <p className="inline-flex rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
          {pill}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
          {headline}
        </h1>
        <p className="max-w-xl text-lg text-on-surface/80">
          {body}
        </p>
        <p className="max-w-xl text-sm text-on-surface/70">
          {supporting}
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={primaryCta.href}
            className="rounded-full bg-primary px-6 py-3 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => trackEvent('hero_click', primaryCta.analytics ?? { cta: primaryCta.label })}
          >
            {primaryCta.label}
          </Link>
        </div>
        {secondaryLink ? (
          <div className="text-sm font-semibold">
            <Link
              href={secondaryLink.href}
              className="inline-flex items-center gap-1 text-on-surface/80 underline-offset-4 transition hover:text-on-surface hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => trackEvent('hero_click', secondaryLink.analytics ?? { cta: secondaryLink.label })}
            >
              {secondaryLink.label}
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : null}
      </div>
      <div className="space-y-4 rounded-3xl border border-outline/20 bg-surface p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-on-surface">What IHARC offers</h2>
        <dl className="space-y-3 text-sm text-on-surface/80">
          <div className="rounded-xl bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Shared data.</dt>
            <dd>One public picture to guide action.</dd>
          </div>
          <div className="rounded-xl bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Rapid response.</dt>
            <dd>Coordinated tasks with tracked follow-through.</dd>
          </div>
          <div className="rounded-xl bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Secure STEVI portal.</dt>
            <dd>Clients and staff manage appointments, plans, and documents together.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
