import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceDetailAnalytics } from '@/components/resources/resource-analytics';
import { ResourceEmbed } from '@/components/resources/resource-embed';
import { formatResourceDate, getKindLabel, getResourceBySlug } from '@/lib/resources';
import { sanitizeResourceHtml } from '@/lib/sanitize-resource-html';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    return {
      title: 'Resource not found — IHARC',
    };
  }

  const resource = await getResourceBySlug(slug);

  if (!resource || resource.contentChannel !== 'transparency') {
    return {
      title: 'Resource not found — IHARC',
    };
  }

  const kindLabel = getKindLabel(resource.kind);
  const description =
    resource.summary ??
    `Explore the latest ${kindLabel.toLowerCase()} from the Integrated Homelessness and Addictions Response Centre.`;

  return {
    title: `${resource.title} — IHARC`,
    description,
    openGraph: {
      title: resource.title,
      description,
      type: 'article',
      publishedTime: resource.datePublished,
      url: `${SITE_URL}/transparency/resources/${resource.slug}`,
    },
    alternates: {
      canonical: `${SITE_URL}/transparency/resources/${resource.slug}`,
    },
  } satisfies Metadata;
}

export default async function TransparencyResourceDetailPage({ params }: { params: RouteParams }) {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    notFound();
  }

  const resource = await getResourceBySlug(slug);

  if (!resource || resource.contentChannel !== 'transparency') {
    notFound();
  }

  const kindLabel = getKindLabel(resource.kind);
  const formattedDate = formatResourceDate(resource.datePublished);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: resource.title,
    datePublished: resource.datePublished,
    keywords: resource.tags.join(', '),
    mainEntityOfPage: `${SITE_URL}/transparency/resources/${resource.slug}`,
    author: {
      '@type': 'Organization',
      name: 'Integrated Homelessness and Addictions Response Centre',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Integrated Homelessness and Addictions Response Centre',
    },
  } as const;

  const embedSection = resource.embed ? (
    <section aria-label="Primary resource" className="space-y-6">
      <ResourceEmbed resource={resource} />
    </section>
  ) : null;

  const bodySection = resource.bodyHtml ? (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-on-surface">About this artifact</h2>
      <div
        className="prose prose-slate max-w-none rounded-3xl border border-outline/15 bg-surface p-6 text-on-surface prose-headings:text-on-surface prose-strong:text-on-surface prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeResourceHtml(resource.bodyHtml) }}
      />
    </section>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href="/transparency"
          className="inline-flex items-center gap-2 rounded-full text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          ← Back to transparency hub
        </Link>
      </nav>

      <header className="space-y-4 text-balance">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-primary/60 bg-primary/10 text-primary">
            {kindLabel}
          </Badge>
          <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">{formattedDate}</span>
          {resource.location ? (
            <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">
              {resource.location}
            </span>
          ) : null}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{resource.title}</h1>
        {resource.summary ? <p className="text-base text-on-surface/80">{resource.summary}</p> : null}
      </header>

      {resource.embedPlacement === 'above' ? embedSection : null}
      {bodySection}
      {resource.embedPlacement === 'below' ? embedSection : null}

      {resource.attachments.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-on-surface">Attachments</h2>
          <ul className="space-y-3">
            {resource.attachments.map((attachment) => (
              <li key={attachment.url}>
                <Button asChild variant="outline">
                  <Link href={attachment.url} target="_blank" rel="noopener noreferrer">
                    {attachment.label}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resource.tags.length ? (
        <section aria-label="Tags" className="flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-outline/30 bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-on-surface/60"
            >
              {tag}
            </span>
          ))}
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResourceDetailAnalytics resource={resource} />
    </div>
  );
}
