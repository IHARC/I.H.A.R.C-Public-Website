import Link from 'next/link';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPlanList } from '@/data/plans';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const plans = await getPlanList(null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <TooltipProvider>
        <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Community collaboration</p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Working Plans</h1>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand/70 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300"
                  aria-label="What this page is for"
                >
                  <Info className="h-4 w-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-left">
                What this page is for: see the Working Plans promoted from the idea queue and learn how to support each focus area.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-base text-slate-700 dark:text-slate-300">
            <strong>Working Plans</strong> — Selected ideas we’re developing together. These are not final. Join the work.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/portal/ideas"
              className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Browse the proposal queue
            </Link>
            <Link
              href="/portal/ideas/submit"
              className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Share an idea
            </Link>
          </div>
        </header>
      </TooltipProvider>

      <section className="space-y-4">
        {plans.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <li key={plan.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-muted">
                    <span>Last updated {new Date(plan.updated_at ?? plan.created_at).toLocaleDateString('en-CA')}</span>
                    {plan.nextKeyDate ? (
                      <span className="font-semibold text-brand">
                        Next key date · {new Date(plan.nextKeyDate.scheduled_for).toLocaleDateString('en-CA')}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    <Link href={`/plans/${plan.slug}`} className="focus:outline-none focus-visible:underline">
                      {plan.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{plan.canonical_summary}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {plan.focus_areas.slice(0, 4).map((focus) => (
                    <span key={focus.id} className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
                      {focus.name}
                    </span>
                  ))}
                  {plan.focus_areas.length > 4 ? (
                    <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 dark:border-slate-700">+{plan.focus_areas.length - 4} more</span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <Link href={`/plans/${plan.slug}`} className="text-sm font-semibold text-brand hover:underline">
                    Open plan overview
                  </Link>
                  {plan.nextKeyDate ? (
                  <Link href={`/plans/${plan.slug}#timeline`} className="text-sm text-muted hover:text-brand">
                      See timeline
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Working Plans will appear here once moderators promote ideas from the proposal queue.
          </div>
        )}
      </section>
    </div>
  );
}
