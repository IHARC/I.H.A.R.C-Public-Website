import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { POLICY_CATEGORY_LABELS, type Policy } from '@/data/policies';

function formatReviewed(value: string) {
  try {
    return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function PolicyCard({
  policy,
  hrefBase = '/transparency/policies',
}: {
  policy: Policy;
  hrefBase?: string;
}) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-outline/15 bg-surface p-6 text-on-surface shadow-level-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/50 text-primary">
          {POLICY_CATEGORY_LABELS[policy.category]}
        </Badge>
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface/60">
          Last reviewed {formatReviewed(policy.lastReviewedAt)}
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight text-on-surface">{policy.title}</h3>
        <p className="text-sm text-on-surface/80">{policy.shortSummary}</p>
      </div>
      <div className="mt-auto">
        <Link
          href={`${hrefBase}/${policy.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Read policy
        </Link>
      </div>
    </article>
  );
}
