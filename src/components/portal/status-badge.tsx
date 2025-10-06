import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-surface-container text-on-surface ring-outline/40' },
  under_review: { label: 'Under Review', className: 'bg-primary/10 text-primary ring-primary/30' },
  in_progress: { label: 'In Progress', className: 'bg-primary text-on-primary ring-primary/40' },
  adopted: { label: 'Adopted', className: 'bg-secondary-container text-on-secondary-container ring-outline/30' },
  not_feasible: { label: 'Not Feasible', className: 'bg-surface-variant text-on-surface ring-outline/50' },
  archived: { label: 'Archived', className: 'bg-surface-container-high text-on-surface/80 ring-outline/50' },
};

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP['new'];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors',
        info.className,
      )}
    >
      {info.label}
    </span>
  );
}
