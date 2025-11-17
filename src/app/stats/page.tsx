import Link from 'next/link';
import { DashboardCards } from '@/components/metrics/dashboard-cards';
import { TrendChart } from '@/components/metrics/trend-chart';
import { getMetricRows, getMetricCards, getMetricSummary, groupMetricRows } from '@/data/metrics';
import { steviPortalUrl } from '@/lib/stevi-portal';

export const dynamic = 'force-dynamic';

const STEVI_HOME_URL = steviPortalUrl('/');

export default async function StatsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const rangeParam = resolvedParams.range;
  const range = (Array.isArray(rangeParam) ? rangeParam[0] : rangeParam) === '30d' ? 30 : 7;
  const metricRows = await getMetricRows(range, null);
  const groupMap = metricRows.length ? groupMetricRows(metricRows) : {};
  const cards = await getMetricCards(range, null);
  const dashboardItems = cards.map(({ sortOrder: _sortOrder, status: _status, ...card }) => card);

  const groupedEntries = Object.entries(groupMap);
  const hasMetrics = dashboardItems.length > 0;
  const showPlaceholder = !hasMetrics;
  const summary = hasMetrics
    ? await getMetricSummary(range, null)
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
          <DashboardCards items={dashboardItems} />
          <section className="grid gap-6 lg:grid-cols-2">
            {groupedEntries.map(([key, series]) => {
              const definition = series[0]?.metric_catalog;
              const title = definition?.label ?? definition?.slug ?? key;
              const chartData = series
                .filter((item) => item.value_status === 'reported' && typeof item.value === 'number')
                .map((item) => ({ date: item.metric_date, value: item.value as number }));

              return (
                <TrendChart
                  key={key}
                  title={title}
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
            href={STEVI_HOME_URL}
            prefetch={false}
            className="inline-flex items-center rounded-full bg-brand px-4 py-2 font-medium text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Visit the STEVI portal
          </Link>
          <Link
            href="/news"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Read the latest updates
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">Current focus</h4>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Outreach teams publish new STEVI plan updates every week so these dashboards reflect what matters on the ground.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">How to contribute</h4>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            If you&apos;re supporting someone connected to IHARC, request STEVI credentials. Everyone else can follow public updates here and email{' '}
            <a href="mailto:outreach@iharc.ca" className="text-brand underline">
              outreach@iharc.ca
            </a>{' '}
            with urgent tips.
          </p>
        </div>
      </section>
    </div>
  );
}
