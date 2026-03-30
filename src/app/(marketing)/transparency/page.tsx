import type { Metadata } from 'next';
import Link from 'next/link';

import { PolicyCard } from '@/components/policies/policy-card';
import { ResourceCard } from '@/components/resources/resource-card';
import { fetchPublishedPolicies } from '@/data/policies';
import { buildMarketingMetadata } from '@/lib/site-metadata';
import { listResources } from '@/lib/resources';

const transparencyAreas = [
  {
    title: 'Policies and SOPs',
    body: 'The published standards that guide client rights, operations, safety, governance, and internal accountability.',
  },
  {
    title: 'Decision artifacts',
    body: 'Reports, governance records, and supporting materials connected to public-facing decisions and planning.',
  },
  {
    title: 'Community metrics',
    body: 'Data pages that explain how conditions are changing and what IHARC is measuring publicly over time.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMarketingMetadata({
    title: 'Transparency Hub — IHARC',
    description:
      'Review published IHARC policies, SOPs, governance materials, and public accountability resources.',
    path: '/transparency',
  });
}

export default async function TransparencyPage() {
  const [policies, transparencyResources] = await Promise.all([
    fetchPublishedPolicies(),
    listResources({ channel: 'transparency' }),
  ]);

  const featuredPolicies = policies.slice(0, 6);
  const featuredResources = transparencyResources.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <div className="space-y-16">
        <header className="grid gap-8 border-b border-outline/12 pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
          <div className="max-w-3xl space-y-5 text-balance">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Transparency Hub
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              The public record for how IHARC works, decides, and reports.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              This is where IHARC publishes the documents and artifacts that support public trust:
              operating standards, governance material, and accountability resources. Updates and
              public storytelling live elsewhere. This page is for the record itself.
            </p>
          </div>
          <div className="space-y-4 border-t border-outline/12 pt-6 text-sm leading-7 text-on-surface/72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p>
              Use the Transparency Hub when you want to inspect source material rather than a
              summary or announcement.
            </p>
            <p>
              Use Updates for news and narrative context. Use Data for metrics and current public
              indicators.
            </p>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              What is here
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Three ways to inspect the work in public.
            </h2>
          </div>
          <div className="divide-y divide-outline/12 border-y border-outline/12">
            {transparencyAreas.map((area) => (
              <article key={area.title} className="grid gap-3 py-6 sm:grid-cols-[14rem_minmax(0,1fr)]">
                <h3 className="font-heading text-xl font-semibold">{area.title}</h3>
                <p className="text-sm leading-7 text-on-surface/74">{area.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-outline/12 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Published policies
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Standards currently published for public review.
              </h2>
            </div>
            <Link
              href="/transparency/policies"
              className="inline-flex min-h-11 items-center rounded-full border border-outline/25 px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Browse all SOPs
            </Link>
          </div>
          {featuredPolicies.length === 0 ? (
            <p className="text-sm leading-7 text-on-surface/72">Published policies will appear here.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredPolicies.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} hrefBase="/transparency/policies" />
              ))}
            </div>
          )}
        </section>

        <section id="resources" className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-outline/12 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Transparency artifacts
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Reports, briefings, and supporting records tied to the public response.
              </h2>
            </div>
            <Link
              href="/resources"
              className="inline-flex min-h-11 items-center rounded-full border border-outline/25 px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Open resource library
            </Link>
          </div>
          {featuredResources.length === 0 ? (
            <p className="text-sm leading-7 text-on-surface/72">
              Transparency artifacts will appear here.
            </p>
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

        <section className="rounded-[2rem] bg-surface-container-low px-6 py-8 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Related public views
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Need context instead of source documents?
              </h2>
              <p className="text-sm leading-7 text-on-surface/74">
                Use Updates for current news and public notes from the field, or visit Data to
                review current metrics and point-in-time counts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/updates"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                View updates
              </Link>
              <Link
                href="/data"
                className="inline-flex min-h-11 items-center rounded-full border border-outline/25 px-5 py-2.5 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Browse data
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
