import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/site/Hero';
import { ContextCards } from '@/components/site/ContextCards';

export const metadata: Metadata = {
  title: 'IHARC — Inclusive Housing & Health Collaboration',
  description:
    'Learn how Northumberland partners co-design housing and overdose responses. Explore the collaboration portal, read the emergency brief, and see how to support neighbours.',
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-balance md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Stay involved</h2>
            <p className="mt-2 max-w-xl text-on-surface/80">
              Join neighbours, agencies, and Town staff in shaping rapid responses. Every action is trackable and grounded in shared evidence.
            </p>
          </div>
          <div className="grid w-full max-w-xl gap-3 md:w-auto">
            <Link
              href="/command-center/ideas"
              className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-on-primary shadow transition hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            >
              Propose a solution
            </Link>
            <Link
              href="/command-center/ideas?sort=top"
              className="rounded-full border border-outline/30 px-6 py-3 text-center text-sm font-semibold text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            >
              Comment and up-vote ideas
            </Link>
            <Link
              href="/command-center/roadmap"
              className="rounded-full border border-outline/30 px-6 py-3 text-center text-sm font-semibold text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            >
              Track plan progress
            </Link>
          </div>
        </div>
      </section>

      <section id="help" className="mx-auto w-full max-w-6xl space-y-6 px-4">
        <h2 className="text-3xl font-semibold text-on-surface">Need support right now?</h2>
        <p className="max-w-3xl text-on-surface/80">
          Reach out to partners offering health and safety supplies, overdose response kits, and pathways to treatment. Moderators keep this list current.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-outline/20 bg-surface p-6">
            <h3 className="text-lg font-semibold text-on-surface">Shelter intake</h3>
            <p className="mt-2 text-sm text-on-surface/80">
              Call 2-1-1 or visit the County housing help centre for placement support.
            </p>
          </div>
          <div className="rounded-3xl border border-outline/20 bg-surface p-6">
            <h3 className="text-lg font-semibold text-on-surface">Health outreach</h3>
            <p className="mt-2 text-sm text-on-surface/80">
              Mobile teams share health and safety supplies, overdose response kits, and pathways to treatment.
            </p>
          </div>
          <div className="rounded-3xl border border-outline/20 bg-surface p-6">
            <h3 className="text-lg font-semibold text-on-surface">Community contacts</h3>
            <p className="mt-2 text-sm text-on-surface/80">
              Email <Link href="mailto:portal@iharc.ca" className="text-primary underline">portal@iharc.ca</Link> for portal orientation or to surface a new resource.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
