import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyCard } from '@/components/policies/policy-card';
import { fetchPublishedPolicies } from '@/data/policies';

export const metadata: Metadata = {
  title: 'Transparency Hub — IHARC',
  description:
    'See IHARC policies, governance practices, and how we steward community resources. Built for neighbours, partners, and staff who want clarity on how decisions are made.',
};

export default async function TransparencyPage() {
  const policies = await fetchPublishedPolicies();
  const featured = policies.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Transparency</p>
        <h1 className="text-4xl font-bold tracking-tight">How IHARC stays accountable to neighbours</h1>
        <p className="text-base text-on-surface/80">
          We publish policies, governance commitments, and public metrics so anyone can see how we operate. If you have
          feedback, contact outreach@iharc.ca and we will route it to the right team.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-outline/15 bg-surface p-8 text-on-surface shadow-level-1 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Governance</h2>
          <p className="text-sm text-on-surface/80">
            IHARC is a community-led initiative convening neighbours, agencies, and local government. Decisions are
            recorded and shared through delegations, policy updates, and public metrics.
          </p>
          <Link
            href="/policies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View all policies
          </Link>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Data & metrics</h2>
          <p className="text-sm text-on-surface/80">
            Follow community status updates on housing, shelter, and overdose response. We update metrics as new data
            is approved for release.
          </p>
          <Link
            href="/data"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Browse the dashboard
          </Link>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Accountability</h2>
          <p className="text-sm text-on-surface/80">
            We commit to community health, Good Samaritan protections, and transparent partner roles. Questions? Email
            outreach@iharc.ca and we will respond.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-on-surface">Featured policies</h2>
          <Link
            href="/policies"
            className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-on-surface/70">Published policies will appear here.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
