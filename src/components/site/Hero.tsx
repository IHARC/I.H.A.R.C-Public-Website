'use client';

import Image from 'next/image';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { HeroContent } from '@/data/marketing-content';

type HeroProps = {
  content: HeroContent;
};

export function Hero({ content }: HeroProps) {
  const { pill, headline, body, supporting, primaryCta, secondaryLink, imageUrl, imageAlt } = content;
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
      <div className="space-y-6 text-balance lg:col-span-7">
        <p className="inline-flex rounded-[var(--md-sys-shape-corner-small)] bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
          {pill}
        </p>
        <h1 className="type-headline-large text-on-surface">
          {headline}
        </h1>
        <p className="max-w-2xl type-body-large text-on-surface/80">
          {body}
        </p>
        <p className="max-w-2xl type-body-medium text-on-surface/70">
          {supporting}
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={primaryCta.href}
            className="rounded-[var(--md-sys-shape-corner-small)] bg-primary px-6 py-3 text-on-primary shadow-md transition hover:bg-primary/92 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      <div className="space-y-4 rounded-[var(--md-sys-shape-corner-large)] border border-outline/20 bg-surface p-8 shadow-md lg:col-span-5">
        {imageUrl ? (
          <div className="relative mb-4 overflow-hidden rounded-[var(--md-sys-shape-corner-medium)] border border-outline/10 bg-surface-container">
            <div className="absolute inset-0 bg-gradient-to-b from-surface/10 via-surface/0 to-surface/50" aria-hidden />
            <Image
              src={imageUrl}
              alt={imageAlt || ''}
              width={960}
              height={540}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        ) : null}
        <h2 className="type-title-large text-on-surface">What IHARC offers</h2>
        <dl className="space-y-3 text-sm text-on-surface/80">
          <div className="rounded-[var(--md-sys-shape-corner-medium)] bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Shared data.</dt>
            <dd>One public picture to guide action.</dd>
          </div>
          <div className="rounded-[var(--md-sys-shape-corner-medium)] bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Rapid response.</dt>
            <dd>Coordinated tasks with tracked follow-through.</dd>
          </div>
          <div className="rounded-[var(--md-sys-shape-corner-medium)] bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Secure STEVI portal.</dt>
            <dd>Clients and staff manage appointments, plans, and documents together.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
