import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import type { Database } from '@/types/supabase';

const numberFormatter = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

function formatMetricValue(value: number, unit?: string | null) {
  const formatted = Number.isInteger(value) ? value.toLocaleString('en-CA') : numberFormatter.format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatMetricDate(value: string) {
  return new Date(value).toLocaleDateString('en-CA');
}

export const dynamic = 'force-dynamic';

type MetricRow = {
  metric_id: string;
  metric_date: string;
  value: number | null;
  value_status: Database['portal']['Enums']['metric_value_status'];
  metric_catalog: MetricDefinition | null;
};

type MetricDefinition = Database['portal']['Tables']['metric_catalog']['Row'];

type MetricDailyRow = Database['portal']['Tables']['metric_daily']['Row'] & {
  metric_catalog: MetricDefinition | MetricDefinition[] | null;
};

function resolveMetricCatalogRelation(
  relation: MetricDefinition | MetricDefinition[] | null,
): MetricDefinition | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation;
}

export default async function ProgressPage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');

  const { data, error } = await portal
    .from('metric_daily')
    .select('metric_date, metric_id, value, value_status, metric_catalog:metric_id(id, slug, label, unit, sort_order, is_active)')
    .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .order('metric_date', { ascending: true });

  if (error) {
    console.error('Unable to load progress metrics', error);
  }

  const rows: MetricRow[] = ((data ?? []) as unknown as MetricDailyRow[])
    .map((row) => ({
      metric_id: row.metric_id,
      metric_date: row.metric_date,
      value: row.value,
      value_status: row.value_status,
      metric_catalog: resolveMetricCatalogRelation(row.metric_catalog),
    }))
    .filter((row) => row.metric_catalog?.is_active !== false);

  const grouped = rows.reduce<Record<string, MetricRow[]>>((acc, row) => {
    if (!acc[row.metric_id]) acc[row.metric_id] = [];
    acc[row.metric_id].push(row);
    return acc;
  }, {});

  const cards = Object.values(grouped)
    .map((series) => {
      const ordered = [...series].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
      const latest = ordered.at(-1);
      if (!latest) return null;

      const definition = latest.metric_catalog;
      const label = definition?.label ?? definition?.slug ?? 'Metric';
      const unit = definition?.unit ?? null;
      const sortOrder = definition?.sort_order ?? 0;
      const caption = `Updated ${formatMetricDate(latest.metric_date)}`;

      let valueLabel = 'Pending update';
      let description: string | undefined;

      if (latest.value_status === 'reported' && typeof latest.value === 'number') {
        valueLabel = formatMetricValue(latest.value, unit);
        description = `Reported on ${formatMetricDate(latest.metric_date)}`;
      } else {
        const latestReported = ordered
          .filter((entry) => entry.value_status === 'reported' && typeof entry.value === 'number')
          .slice(-1)[0];
        if (latestReported && typeof latestReported.value === 'number') {
          description = `Last reported ${formatMetricValue(
            latestReported.value,
            unit,
          )} on ${formatMetricDate(latestReported.metric_date)}`;
        } else {
          description = 'Awaiting first reported value';
        }
      }

      return {
        key: definition?.id ?? latest.metric_id,
        label,
        value: valueLabel,
        caption,
        description,
        sortOrder,
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const dashboardItems = cards.map(({ sortOrder: _sortOrder, ...item }) => item);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Progress snapshot</h1>
        <p className="text-base text-slate-700 dark:text-slate-300">
          Follow key housing and public health indicators alongside Working Plan activity. Use this view as a quick check; open the full stats dashboard for complete charts, context, and compassionate response planning.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/stats"
            className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Open the stats dashboard
          </Link>
          <Link
            href="/portal/plans"
            className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View Working Plans
          </Link>
        </div>
      </header>

      {dashboardItems.length ? (
        <DashboardCards items={dashboardItems} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Metrics will appear here once data partners publish daily updates.
        </div>
      )}
    </div>
  );
}
