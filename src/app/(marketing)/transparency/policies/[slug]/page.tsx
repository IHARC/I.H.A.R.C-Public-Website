import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getPublishedPolicyBySlug, POLICY_CATEGORY_LABELS } from '@/data/policies';
import { sanitizeResourceHtml } from '@/lib/sanitize-resource-html';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(value: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    return {
      title: 'Policy not found — IHARC',
    };
  }

  const policy = await getPublishedPolicyBySlug(slug);
  if (!policy) {
    return {
      title: 'Policy not found — IHARC',
    };
  }

  const description = policy.shortSummary || 'Read IHARC policy details for public transparency.';

  return {
    title: `${policy.title} — IHARC`,
    description,
    openGraph: {
      title: policy.title,
      description,
      type: 'article',
      publishedTime: policy.lastReviewedAt,
      url: `${SITE_URL}/transparency/policies/${policy.slug}`,
    },
    alternates: {
      canonical: `${SITE_URL}/transparency/policies/${policy.slug}`,
    },
  } satisfies Metadata;
}

export default async function TransparencyPolicyDetailPage({ params }: { params: RouteParams }) {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    notFound();
  }

  const policy = await getPublishedPolicyBySlug(slug);
  if (!policy) {
    notFound();
  }

  const reviewed = formatDate(policy.lastReviewedAt);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: policy.title,
    dateModified: policy.updatedAt,
    datePublished: policy.lastReviewedAt,
    mainEntityOfPage: `${SITE_URL}/transparency/policies/${policy.slug}`,
    about: POLICY_CATEGORY_LABELS[policy.category],
    author: {
      '@type': 'Organization',
      name: 'Integrated Homelessness and Addictions Response Centre',
    },
  } as const;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href="/transparency/policies"
          className="inline-flex items-center gap-2 rounded-full text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          ← Back to SOPs & policies
        </Link>
      </nav>

      <header className="space-y-4 text-balance">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-primary/60 bg-primary/10 text-primary">
            {POLICY_CATEGORY_LABELS[policy.category]}
          </Badge>
          {reviewed ? <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">Last reviewed {reviewed}</span> : null}
          {policy.effectiveFrom ? (
            <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">
              Effective {formatDate(policy.effectiveFrom)}
            </span>
          ) : null}
          {policy.effectiveTo ? (
            <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">
              Expires {formatDate(policy.effectiveTo)}
            </span>
          ) : null}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{policy.title}</h1>
        <p className="text-base text-on-surface/80">{policy.shortSummary}</p>
      </header>

      <article
        className="prose prose-slate max-w-none rounded-3xl border border-outline/15 bg-surface p-6 text-on-surface prose-headings:text-on-surface prose-strong:text-on-surface prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeResourceHtml(policy.bodyHtml) }}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
