import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CONTROLLED_DOCUMENT_CATEGORY_LABELS, type PublicDocument } from '@/data/policies';

function formatReviewed(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function PublicDocumentCard({
  publicDocument,
  hrefBase = '/transparency/policies',
}: {
  publicDocument: PublicDocument;
  hrefBase?: string;
}) {
  const reviewedDate = formatReviewed(publicDocument.lastRevisedAt);

  return (
    <article className="flex h-full flex-col gap-5 rounded-[2rem] border border-outline/12 bg-surface-container-low px-6 py-6 text-on-surface transition hover:border-primary/20 hover:bg-surface">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/35 bg-primary/6 text-primary">
          {CONTROLLED_DOCUMENT_CATEGORY_LABELS[publicDocument.category]}
        </Badge>
        {reviewedDate ? (
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-on-surface/60">
            Last revised {reviewedDate}
          </span>
        ) : null}
      </div>
      <div className="space-y-3">
        <h3 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-on-surface">
          {publicDocument.title}
        </h3>
        <p className="text-sm leading-7 text-on-surface/76">{publicDocument.shortSummary}</p>
      </div>
      <div className="mt-auto">
        <Link
          href={`${hrefBase}/${publicDocument.slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline/20 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/28 hover:bg-primary/6 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
        >
          Read document
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
