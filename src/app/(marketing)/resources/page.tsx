import type { Metadata } from 'next';
import { ResourceCard } from '@/components/resources/resource-card';
import { ResourceFiltersControls } from '@/components/resources/resource-filters';
import { ResourceIndexAnalytics } from '@/components/resources/resource-analytics';
import {
  RESOURCE_KIND_LABELS,
  fetchResourceLibrary,
  filterResources,
  getResourceTags,
  getResourceYears,
  normalizeFilters,
  type ResourceFilters,
} from '@/lib/resources';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

export const metadata: Metadata = {
  title: 'Reports & Resources — IHARC',
  description:
    'Browse IHARC research, presentations, datasets, and practical resources that support community response work in Northumberland County.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolved = (await searchParams) ?? {};
  const filters = fromSearchParams(resolved);
  const normalized = normalizeFilters({ ...filters, channel: 'resources' });

  const dataset = await fetchResourceLibrary();
  const baseResources = filterResources(dataset, { channel: 'resources' });
  const items = filterResources(baseResources, normalized);
  const tags = getResourceTags(baseResources);
  const years = getResourceYears(baseResources);
  const kinds = (Object.keys(RESOURCE_KIND_LABELS) as Array<keyof typeof RESOURCE_KIND_LABELS>)
    .map((value) => ({
      value,
      label: RESOURCE_KIND_LABELS[value],
    }))
    .filter((entry) => entry.value !== 'blog' && entry.value !== 'press' && entry.value !== 'policy');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Reports & Resources — IHARC',
    description:
      'Access datasets, practical guides, and research resources from the Integrated Homelessness and Addictions Response Centre.',
    url: `${SITE_URL}/resources`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'IHARC — Integrated Homelessness and Addictions Response Centre',
      url: SITE_URL,
    },
    about: {
      '@type': 'Organization',
      name: 'Integrated Homelessness and Addictions Response Centre',
    },
  } as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Reports & Resources</p>
        <h1 className="text-4xl font-bold tracking-tight">Documenting the collaborative response to housing and overdose emergencies</h1>
        <p className="text-base text-on-surface/80">
          Browse practical tools, research summaries, and datasets published by IHARC teams and partners. For transparency documents and SOPs, use the Transparency Hub.
        </p>
      </header>

      <ResourceFiltersControls filters={normalized} kinds={kinds} tags={tags} years={years} />

      <section aria-live="polite" className="space-y-6">
        <h2 className="text-xl font-semibold text-on-surface">{items.length} resource{items.length === 1 ? '' : 's'}</h2>
        {items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((resource) => (
              <ResourceCard key={resource.slug} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-on-surface/80">
            <p>No resources match the selected filters yet. Try clearing filters or checking back soon.</p>
          </div>
        )}
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResourceIndexAnalytics filters={normalized} total={items.length} />
    </div>
  );
}

function fromSearchParams(params: Record<string, string | string[] | undefined>): ResourceFilters {
  const getValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;
  const kind = getValue(params.kind);

  return {
    q: getValue(params.q),
    kind: kind && kind in RESOURCE_KIND_LABELS ? (kind as keyof typeof RESOURCE_KIND_LABELS) : null,
    tag: getValue(params.tag),
    year: getValue(params.year),
    channel: 'resources',
  } satisfies ResourceFilters;
}
