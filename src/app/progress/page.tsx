import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import type { Database } from '@/types/supabase';

const METRIC_LABELS: Record<string, string> = {
  outdoor_count: 'Outdoor Individuals',
  shelter_occupancy: 'Shelter Occupancy (%)',
  overdoses_reported: 'Overdoses Reported',
  narcan_distributed: 'Narcan Kits Distributed',
  encampment_count: 'Encampments Observed',
  warming_beds_available: 'Warming Beds Available',
};

export const dynamic = 'force-dynamic';

type MetricRow = Pick<Database['portal']['Tables']['metric_daily']['Row'], 'metric_key' | 'metric_date' | 'value'>;

export default async function ProgressPage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');

  const { data, error } = await portal
    .from('metric_daily')
    .select('metric_key, metric_date, value')
    .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .order('metric_date', { ascending: true });

  if (error) {
    console.error('Unable to load progress metrics', error);
  }

  const rows: MetricRow[] = (data ?? []) as MetricRow[];

  const grouped = rows.reduce<Record<string, MetricRow[]>>((acc, row) => {
    if (!acc[row.metric_key]) acc[row.metric_key] = [];
    acc[row.metric_key].push(row);
    return acc;
  }, {});

  const cards = Object.entries(grouped).map(([key, series]) => {
    const ordered = [...series].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
    const latest = ordered.at(-1);
    const first = ordered[0];
    const value = latest?.value ?? 0;
    const delta = value - (first?.value ?? 0);
    const trend: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      key,
      label: METRIC_LABELS[key] ?? key,
      value: typeof value === 'number' ? value.toString() : '—',
      caption: latest ? `Updated ${new Date(latest.metric_date).toLocaleDateString('en-CA')}` : undefined,
      description: first
        ? `Change ${delta > 0 ? '+' : ''}${delta.toFixed(1)} in last 30 days`
        : undefined,
      trend,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Progress snapshot</h1>
        <p className="text-base text-slate-700 dark:text-slate-300">
          Follow key housing and public health indicators alongside Working Plan activity. Use this view as a quick check; open the full stats dashboard for complete charts and context.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/stats"
            className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Open the stats dashboard
          </Link>
          <Link
            href="/plans"
            className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View Working Plans
          </Link>
        </div>
      </header>

      {cards.length ? (
        <DashboardCards items={cards} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Metrics will appear here once data partners publish daily updates.
        </div>
      )}
    </div>
  );
}
