import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {cta && (
        <Button asChild className="mt-4">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
