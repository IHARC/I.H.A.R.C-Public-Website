'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-6 text-balance">
        <p className="inline-flex rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
          Inclusive Housing & Health Collaboration
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
          Northumberland neighbours working together for housing stability and overdose prevention.
        </h1>
        <p className="max-w-xl text-lg text-on-surface/80">
          IHARC brings service partners, residents, and local government into one shared workflow. We respond quickly, share evidence, and keep every action grounded in dignity.
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href="/#help"
            className="rounded-full bg-primary px-6 py-3 text-on-primary shadow transition hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => trackEvent('hero_click', { cta: 'help' })}
          >
            Get Help
          </Link>
          <Link
            href="/emergency"
            className="rounded-full border border-outline/40 px-6 py-3 text-on-surface transition hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => trackEvent('hero_click', { cta: 'brief' })}
          >
            State of Emergency Brief
          </Link>
          <Link
            href="/command-center"
            className="rounded-full border border-primary px-6 py-3 text-primary transition hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => trackEvent('hero_click', { cta: 'portal' })}
          >
            Open Collaboration Portal
          </Link>
        </div>
      </div>
      <div className="space-y-4 rounded-3xl border border-outline/20 bg-surface p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-on-surface">What IHARC offers</h2>
        <p className="text-sm text-on-surface/80">
          Shared data, rapid response coordination, and space for community-led solutions. Every update stays transparent so neighbours can see change taking shape.
        </p>
        <dl className="space-y-3 text-sm text-on-surface/80">
          <div className="rounded-xl bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Real-time stats</dt>
            <dd>Homelessness, shelter capacity, and overdose response indicators updated by trusted partners.</dd>
          </div>
          <div className="rounded-xl bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Collaboration portal</dt>
            <dd>Co-design solutions, track plans, and contribute without sharing identifying details.</dd>
          </div>
          <div className="rounded-xl bg-surface-container p-4">
            <dt className="font-semibold text-on-surface">Community commitments</dt>
            <dd>Respectful participation, transparent decisions, and support for frontline teams.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
