import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Paginator({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: URLSearchParams;
}) {
  if (pageCount <= 1) return null;

  const previousDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const prevParams = new URLSearchParams(searchParams);
  prevParams.set('page', String(Math.max(page - 1, 1)));
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set('page', String(Math.min(page + 1, pageCount)));

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="text-slate-500 dark:text-slate-300">
        Page {page} of {pageCount}
      </span>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" disabled={previousDisabled}>
          <Link href={`${basePath}?${prevParams.toString()}`}>Previous</Link>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={nextDisabled}>
          <Link href={`${basePath}?${nextParams.toString()}`}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
