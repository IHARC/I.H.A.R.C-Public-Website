import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyCard } from '@/components/policies/policy-card';
import { ResourceCard } from '@/components/resources/resource-card';
import { fetchPublishedPolicies } from '@/data/policies';
import { listResources } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Transparency Hub — IHARC',
  description:
    'Review IHARC SOPs, policies, governance artifacts, and accountability resources published for public transparency.',
};

export default async function TransparencyPage() {
  const [policies, transparencyResources] = await Promise.all([
    fetchPublishedPolicies(),
    listResources({ channel: 'transparency' }),
  ]);

  const featuredPolicies = policies.slice(0, 6);
  const featuredResources = transparencyResources.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Transparency Hub</p>
        <h1 className="text-4xl font-bold tracking-tight">How IHARC stays accountable to neighbours</h1>
        <p className="text-base text-on-surface/80">
          This hub centralizes SOPs, policies, and accountability artifacts. Use Updates for news/blog posts and Resources for research and practical materials.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-outline/15 bg-surface p-8 text-on-surface shadow-level-1 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">SOPs & policies</h2>
          <p className="text-sm text-on-surface/80">
            Browse published standards for client rights, safety, governance, and operations.
          </p>
          <Link
            href="/transparency/policies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Browse all SOPs
          </Link>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Accountability artifacts</h2>
          <p className="text-sm text-on-surface/80">
            Access delegations, governance briefings, and transparency records associated with public decisions.
          </p>
          <Link
            href="/transparency#resources"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View artifacts
          </Link>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Community metrics</h2>
          <p className="text-sm text-on-surface/80">
            Follow current trend dashboards and PIT context to understand how response work is evolving.
          </p>
          <Link
            href="/data"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Browse data stories
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-on-surface">Published SOPs & policies</h2>
          <Link
            href="/transparency/policies"
            className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View all
          </Link>
        </div>
        {featuredPolicies.length === 0 ? (
          <p className="text-sm text-on-surface/70">Published policies will appear here.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} hrefBase="/transparency/policies" />
            ))}
          </div>
        )}
      </section>

      <section id="resources" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-on-surface">Transparency artifacts</h2>
          <Link
            href="/resources"
            className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Open full resource library
          </Link>
        </div>
        {featuredResources.length === 0 ? (
          <p className="text-sm text-on-surface/70">Transparency artifacts will appear here.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredResources.map((resource) => (
              <ResourceCard
                key={resource.slug}
                resource={resource}
                hrefBase="/transparency/resources"
                ctaLabel="View artifact"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
