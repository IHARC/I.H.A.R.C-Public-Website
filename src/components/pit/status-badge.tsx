import { cn } from '@/lib/utils';
import { describePitStatus, isPitCountInProgress } from '@/lib/pit/public';
import type { PitSummaryRow } from '@/lib/pit/public';

type PitStatusBadgeProps = {
  summary: PitSummaryRow;
  size?: 'sm' | 'md';
  className?: string;
};

const sizeClasses: Record<NonNullable<PitStatusBadgeProps['size']>, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
};

export function PitStatusBadge({ summary, size = 'sm', className }: PitStatusBadgeProps) {
  const { code, label } = describePitStatus(summary);
  const variantClass = getVariantClass(code);
  const badgeLabel = buildBadgeLabel(label, summary);

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full font-semibold',
        sizeClasses[size],
        variantClass,
        className,
      )}
      aria-label={`Point-in-time count status: ${badgeLabel}`}
    >
      {badgeLabel}
    </span>
  );
}

function getVariantClass(code: ReturnType<typeof describePitStatus>['code']): string {
  switch (code) {
    case 'active':
      return 'border border-primary/30 bg-primary/10 text-primary';
    case 'scheduled':
      return 'border border-tertiary/40 bg-tertiary-container text-on-tertiary-container';
    default:
      return 'border border-outline/40 bg-surface-container text-on-surface-variant';
  }
}

function buildBadgeLabel(base: string, summary: PitSummaryRow): string {
  if (base === 'Active' && isPitCountInProgress(summary)) {
    return 'Active — canvass running';
  }

  if (base === 'Scheduled') {
    return 'Scheduled outreach';
  }

  return 'Completed count';
}
