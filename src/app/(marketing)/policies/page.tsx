import type { Metadata } from 'next';
import { PolicyCard } from '@/components/policies/policy-card';
import { fetchPublishedPolicies, POLICY_CATEGORY_LABELS, type Policy } from '@/data/policies';

export const metadata: Metadata = {
  title: 'Policies & Procedures — IHARC',
  description:
    'Browse IHARC policies, client rights, safety practices, and governance procedures. Published and maintained by IHARC for public transparency.',
};

function groupByCategory(policies: Policy[]) {
  const map = new Map<string, Policy[]>();
  for (const policy of policies) {
    if (!map.has(policy.category)) {
      map.set(policy.category, []);
    }
    map.get(policy.category)?.push(policy);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export default async function PoliciesPage() {
  const policies = await fetchPublishedPolicies();
  const grouped = groupByCategory(policies);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Transparency</p>
        <h1 className="text-4xl font-bold tracking-tight">Policies & procedures that guide IHARC</h1>
        <p className="text-base text-on-surface/80">
          We publish our policies so neighbours, partners, and staff can see the standards we follow. Client rights,
          safety practices, and governance commitments are reviewed regularly and updated when guidance changes.
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-on-surface">{POLICY_CATEGORY_LABELS[category as keyof typeof POLICY_CATEGORY_LABELS]}</h2>
                <p className="text-sm text-on-surface/60">{items.length} item{items.length === 1 ? '' : 's'}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
