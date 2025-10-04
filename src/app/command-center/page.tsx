import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import { TrendChart } from '@/components/portal/trend-chart';

const METRIC_LABELS: Record<string, string> = {
  outdoor_count: 'Outdoor Individuals',
  shelter_occupancy: 'Shelter Occupancy (%)',
  overdoses_reported: 'Overdoses Reported',
  narcan_distributed: 'Narcan Kits Distributed',
  encampment_count: 'Encampments Observed',
  warming_beds_available: 'Warming Beds Available',
};

export default async function CommandCenterPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = searchParams.range === '30d' ? 30 : 7;
  const supabase = createSupabaseRSCClient();
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('portal.metric_daily')
    .select('*')
    .gte('metric_date', since)
    .order('metric_date', { ascending: true });

  if (error) {
    console.error(error);
    throw new Error('Failed to load metrics');
  }

  const grouped = groupMetrics(data ?? []);
  const cards = buildCardData(grouped);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Command Center</h2>
        <RangeSelector active={range} />
      </div>
      <DashboardCards items={cards} />
      <section className="grid gap-6 lg:grid-cols-2">
        {Object.entries(grouped).map(([key, series]) => (
          <TrendChart
            key={key}
            title={METRIC_LABELS[key] ?? key}
            description={`${range}-day trend`}
            data={series.map((item) => ({ date: item.metric_date, value: item.value ?? 0 }))}
            rangeLabel={`${range}-day range`}
          />
        ))}
      </section>
    </div>
  );
}

function groupMetrics(rows: Array<{ metric_key: string; metric_date: string; value: number | null }>) {
  return rows.reduce<Record<string, { metric_date: string; value: number | null }[]>>((acc, row) => {
    if (!acc[row.metric_key]) acc[row.metric_key] = [];
    acc[row.metric_key].push(row);
    return acc;
  }, {});
}

function buildCardData(grouped: ReturnType<typeof groupMetrics>) {
  return Object.entries(grouped).map(([key, series]) => {
    const latest = series[series.length - 1];
    const first = series[0];
    const delta = (latest?.value ?? 0) - (first?.value ?? 0);
    const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      key,
      label: METRIC_LABELS[key] ?? key,
      value: formatMetric(latest?.value),
      caption: latest ? `Updated ${new Date(latest.metric_date).toLocaleDateString('en-CA')}` : undefined,
      description:
        series.length > 1
          ? `Changed ${delta > 0 ? '+' : ''}${delta.toFixed(1)} since ${new Date(first.metric_date).toLocaleDateString('en-CA')}`
          : undefined,
      trend,
    };
  });
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (value % 1 === 0) return value.toLocaleString('en-CA');
  return value.toFixed(1);
}

function RangeSelector({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-2">
      <LinkRange target={7} active={active === 7} />
      <LinkRange target={30} active={active === 30} />
    </div>
  );
}

function LinkRange({ target, active }: { target: number; active: boolean }) {
  const params = new URLSearchParams(target === 30 ? { range: '30d' } : {});
  return (
    <a
      href={params.toString() ? `?${params.toString()}` : '?'}
      className={
        'rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand' +
        (active
          ? ' bg-brand text-white shadow'
          : ' border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800')
      }
    >
      {target}-day
    </a>
  );
}
