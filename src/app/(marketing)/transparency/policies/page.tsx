import type { Metadata } from 'next';
import { PolicyCard } from '@/components/policies/policy-card';
import { fetchPublishedPolicies, POLICY_CATEGORY_LABELS, type Policy } from '@/data/policies';

export const metadata: Metadata = {
  title: 'SOPs & Policies — Transparency Hub — IHARC',
  description:
    'Browse published IHARC SOPs and policies, including client rights, safety practices, and governance procedures.',
};

function groupByCategory(policies: Policy[]) {
  const map = new Map<Policy['category'], Policy[]>();
  for (const policy of policies) {
    if (!map.has(policy.category)) {
      map.set(policy.category, []);
    }
    map.get(policy.category)?.push(policy);
  }
  return Array.from(map.entries());
}

export default async function TransparencyPoliciesPage() {
  const policies = await fetchPublishedPolicies();
  const grouped = groupByCategory(policies);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Transparency Hub</p>
        <h1 className="text-4xl font-bold tracking-tight">Published SOPs & policies</h1>
        <p className="text-base text-on-surface/80">
          We publish our policies so neighbours, partners, and staff can see the standards we follow. Draft and archived records are not shown publicly.
        </p>
      </header>

      {grouped.length === 0 ? (
        <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-on-surface/80">
          <p>No policies are published yet. Please check back soon.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, items]) => (
            <section key={category} className="space-y-4">
              <h2 className="text-2xl font-semibold text-on-surface">{POLICY_CATEGORY_LABELS[category]}</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} hrefBase="/transparency/policies" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
