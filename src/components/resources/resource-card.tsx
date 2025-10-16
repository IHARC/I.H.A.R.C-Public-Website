import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Resource } from '@/lib/resources';
import { formatResourceDate, getKindLabel } from '@/lib/resources';

export function ResourceCard({ resource }: { resource: Resource }) {
  const kindLabel = getKindLabel(resource.kind);
  const formattedDate = formatResourceDate(resource.datePublished);

  return (
    <article className="rounded-3xl border border-outline/20 bg-surface p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md focus-within:border-primary/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="outline" className="border-primary/60 bg-primary/10 text-primary">
          {kindLabel}
        </Badge>
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">{formattedDate}</span>
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-on-surface">
        <Link
          href={`/resources/${resource.slug}`}
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {resource.title}
        </Link>
      </h2>
      {resource.location ? (
        <p className="mt-2 text-sm font-medium text-on-surface/70">{resource.location}</p>
      ) : null}
      {resource.summary ? <p className="mt-3 text-sm text-on-surface/80">{resource.summary}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-outline/30 bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-on-surface/60"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <Link
          href={`/resources/${resource.slug}`}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          View resource
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
