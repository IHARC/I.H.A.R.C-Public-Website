import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { DashboardCards } from '@/components/portal/dashboard-cards';
import { TrendChart } from '@/components/portal/trend-chart';
import type { Database } from '@/types/supabase';

const METRIC_LABELS: Record<string, string> = {
  outdoor_count: 'Neighbours Outdoors',
  shelter_occupancy: 'Shelter Occupancy (%)',
  overdoses_reported: 'Drug Poisoning Emergencies',
  narcan_distributed: 'Naloxone Kits Shared',
  encampment_count: 'Encampment Sites Documented',
  warming_beds_available: 'Warming Beds Available',
};

export const dynamic = 'force-dynamic';

type MetricRow = Pick<
  Database['portal']['Tables']['metric_daily']['Row'],
  'metric_key' | 'metric_date' | 'value' | 'value_status'
>;

type MetricSeries = Record<string, MetricRow[]>;

type MetricCard = {
  key: string;
  label: string;
  value: string;
  caption?: string;
  description?: string;
  trend?: 'up' | 'down' | 'flat';
  status: Database['portal']['Enums']['metric_value_status'];
};

export default async function StatsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const rangeParam = resolvedParams.range;
  const range = (Array.isArray(rangeParam) ? rangeParam[0] : rangeParam) === '30d' ? 30 : 7;
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let metricRows: MetricRow[] = [];
  let metricsUnavailable = false;

  try {
    const { data, error } = await portal
      .from('metric_daily')
      .select('metric_key, metric_date, value, value_status')
      .gte('metric_date', since)
      .order('metric_date', { ascending: true });

    if (error) {
      metricsUnavailable = true;
      console.error('Failed to load IHARC portal metrics', error);
    } else {
      metricRows = (data ?? []) as MetricRow[];
    }
  } catch (error) {
    metricsUnavailable = true;
    console.error('Failed to load IHARC portal metrics', error);
  }

  const grouped = metricRows.length ? groupMetrics(metricRows) : {};
  const cards = metricRows.length ? buildCardData(grouped) : [];

  const groupedEntries = Object.entries(grouped);
  const hasMetrics = cards.length > 0 && !metricsUnavailable;
  const showPlaceholder = !hasMetrics;
  const summary = hasMetrics
    ? buildMetricSummary(cards)
    : 'Metric data will surface here once partners publish updates.';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Community Status Dashboard</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Real-time indicators from partners focused on housing stability, drug poisoning response, and outreach efforts.
          </p>
        </div>
        <RangeSelector active={range} />
      </div>
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
      {showPlaceholder ? (
        <DashboardPlaceholder />
      ) : (
        <>
          <DashboardCards items={cards.map(({ status: _status, ...card }) => card)} />
          <section className="grid gap-6 lg:grid-cols-2">
            {groupedEntries.map(([key, series]) => {
              const chartData = series
                .filter((item) => item.value_status === 'reported' && item.value !== null)
                .map((item) => ({ date: item.metric_date, value: item.value as number }));

              return (
                <TrendChart
                  key={key}
                  title={METRIC_LABELS[key] ?? key}
                  description={`${range}-day trend`}
                  data={chartData}
                  rangeLabel={`${range}-day range`}
                />
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

function groupMetrics(rows: MetricRow[]): MetricSeries {
  return rows.reduce<MetricSeries>((acc, row) => {
    if (!acc[row.metric_key]) acc[row.metric_key] = [];
    acc[row.metric_key].push(row);
    return acc;
  }, {});
}

function buildCardData(grouped: MetricSeries): MetricCard[] {
  return Object.entries(grouped).map(([key, series]) => {
    const ordered = [...series].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
    const latest = ordered.at(-1);

    if (!latest) {
      return {
        key,
        label: METRIC_LABELS[key] ?? key,
        value: 'Pending update',
        caption: undefined,
        description: 'Awaiting first reported value',
        trend: undefined,
        status: 'pending',
      } satisfies MetricCard;
    }

    const reportedSeries = ordered.filter(
      (row) => row.value_status === 'reported' && row.value !== null,
    );
    const latestReported = reportedSeries.at(-1) ?? null;
    const firstReported = reportedSeries[0] ?? null;

    let value = 'Pending update';
    let description: string | undefined;
    let trend: 'up' | 'down' | 'flat' | undefined;

    if (latest.value_status === 'pending') {
      if (latestReported) {
        description = `Last reported ${formatNumber(latestReported.value as number)} on ${formatDate(
          latestReported.metric_date,
        )}`;
      } else {
        description = 'Awaiting first reported value';
      }
    } else {
      const currentValue = (latest.value ?? 0) as number;
      value = formatNumber(currentValue);
      if (reportedSeries.length > 1 && firstReported) {
        const baseline = (firstReported.value ?? 0) as number;
        const delta = currentValue - baseline;
        trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        description = `Changed ${formatDelta(delta)} since ${formatDate(firstReported.metric_date)}`;
      } else {
        description = 'Awaiting additional updates to show change';
      }
    }

    return {
      key,
      label: METRIC_LABELS[key] ?? key,
      value,
      caption: `Updated ${formatDate(latest.metric_date)}`,
      description,
      trend,
      status: latest.value_status,
    } satisfies MetricCard;
  });
}

function buildMetricSummary(cards: MetricCard[]): string {
  if (!cards.length) return 'No metric data available yet.';

  return cards
    .map((card) => {
      if (card.status === 'pending') {
        const detail = card.description ? withPeriod(card.description) : '';
        return `${card.label} awaiting update.${detail ? ' ' + detail : ''}`;
      }

      const trendWord =
        card.trend === 'up' ? 'increased' : card.trend === 'down' ? 'decreased' : 'held steady';
      if (!card.description) {
        return `${card.label} reported ${card.value}.`;
      }

      const detail = withPeriod(card.description);
      return `${card.label} ${trendWord}. ${detail}`;
    })
    .join(' ');
}

function withPeriod(text?: string) {
  if (!text) return '';
  return text.endsWith('.') ? text : `${text}.`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toLocaleString('en-CA') : value.toFixed(1);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-CA');
}

function formatDelta(delta: number) {
  const precision = Math.abs(delta) >= 1 ? 1 : 2;
  const formatted = delta.toFixed(precision);
  return delta > 0 ? `+${formatted}` : formatted;
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
    <Link
      href={params.toString() ? `?${params.toString()}` : '?'}
      className={
        'rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand' +
        (active
          ? ' bg-brand text-white shadow'
          : ' border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800')
      }
    >
      {target}-day
    </Link>
  );
}

function DashboardPlaceholder() {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Metric dashboards coming online</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Data partners are connecting feeds for shelter availability, drug poisoning response, and outreach counts. Once active, these charts will show live numbers and trends to coordinate humane, rapid responses.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href="/portal/ideas"
            className="inline-flex items-center rounded-full bg-brand px-4 py-2 font-medium text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Go to the collaboration portal
          </Link>
          <Link
            href="/portal/ideas?status=under_review"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Review project board candidates
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">Current focus</h4>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            We are co-designing rapid-response ideas with partners in housing, health, and drug poisoning response so the dashboard reflects what matters on the ground.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">How to contribute</h4>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Share solution ideas, react to promising approaches, and flag content needing moderator attention. Official agency responses are labelled for clarity, and proposals must align with humane, evidence-based care.
          </p>
        </div>
      </section>
    </div>
  );
}
