import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' },
  in_progress: { label: 'In Progress', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200' },
  adopted: { label: 'Adopted', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' },
  not_feasible: { label: 'Not Feasible', className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  archived: { label: 'Archived', className: 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-200' },
};

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP['new'];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-slate-200 dark:ring-slate-800',
        info.className,
      )}
    >
      {info.label}
    </span>
  );
}
