import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Resource } from '@/lib/resources';
import { formatResourceDate, getKindLabel } from '@/lib/resources';

export function ResourceCard({
  resource,
  hrefBase = '/resources',
  ctaLabel = 'View resource',
}: {
  resource: Resource;
  hrefBase?: string;
  ctaLabel?: string;
}) {
  const kindLabel = getKindLabel(resource.kind);
  const formattedDate = formatResourceDate(resource.datePublished);
  const href = `${hrefBase}/${resource.slug}`;

  return (
    <article className="flex h-full flex-col rounded-[2rem] border border-outline/12 bg-surface-container-low px-6 py-6 transition hover:border-primary/24 hover:bg-surface focus-within:border-primary/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="outline" className="border-primary/40 bg-primary/8 text-primary">
          {kindLabel}
        </Badge>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-on-surface/60">{formattedDate}</span>
      </div>
      <h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.03em] text-on-surface">
        <Link
          href={href}
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
        >
          {resource.title}
        </Link>
      </h2>
      {resource.location ? (
        <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-on-surface/62">{resource.location}</p>
      ) : null}
      {resource.summary ? <p className="mt-3 text-sm leading-7 text-on-surface/76">{resource.summary}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-outline/20 bg-surface px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-on-surface/60"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline/20 px-4 py-2 transition hover:border-primary/28 hover:bg-primary/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
