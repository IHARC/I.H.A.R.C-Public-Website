import type { Metadata } from 'next';
import { PublicDocumentCard } from '@/components/policies/policy-card';
import {
  CONTROLLED_DOCUMENT_CATEGORY_LABELS,
  fetchPublishedPublicDocuments,
  type PublicDocument,
} from '@/data/policies';

export const metadata: Metadata = {
  title: 'SOPs & Policies — Transparency Hub — IHARC',
  description:
    'Browse published IHARC SOPs and policies, including client rights, safety practices, and governance procedures.',
};

function groupByCategory(documents: PublicDocument[]) {
  const map = new Map<PublicDocument['category'], PublicDocument[]>();
  for (const document of documents) {
    if (!map.has(document.category)) {
      map.set(document.category, []);
    }
    map.get(document.category)?.push(document);
  }
  return Array.from(map.entries());
}

export default async function TransparencyPoliciesPage() {
  const documents = await fetchPublishedPublicDocuments();
  const grouped = groupByCategory(documents);

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
              <h2 className="text-2xl font-semibold text-on-surface">
                {CONTROLLED_DOCUMENT_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((document) => (
                  <PublicDocumentCard key={document.id} publicDocument={document} hrefBase="/transparency/policies" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
