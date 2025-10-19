import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import type { Database } from '@/types/supabase';
import { CACHE_TAGS } from '@/lib/cache/tags';

const METRIC_REVALIDATE_SECONDS = 120;

type MetricDefinition = Database['portal']['Tables']['metric_catalog']['Row'];

export type MetricRow = {
  metric_id: string;
  metric_date: string;
  value: number | null;
  value_status: Database['portal']['Enums']['metric_value_status'];
  metric_catalog: MetricDefinition | null;
  source: string | null;
};

export type MetricCard = {
  key: string;
  label: string;
  value: string;
  caption?: string;
  description?: string;
  status: Database['portal']['Enums']['metric_value_status'];
  sortOrder: number;
};

export type MetricEntry = {
  date: string;
  key: string;
  metric_id: string;
  label: string;
  unit: string | null;
  value: number | null;
  status: string;
  source: string | null;
  sortOrder: number;
};

export type MetricDataset = {
  range: string;
  entries: MetricEntry[];
  latest: Array<{
    key: string;
    date: string;
    value: number | null;
    status: string;
    label: string;
    unit: string | null;
    source: string | null;
  }>;
  summary: string;
};

type MetricCacheKey = {
  range: number;
  viewerId: string | null;
};

type MetricDailyRow = Database['portal']['Tables']['metric_daily']['Row'] & {
  metric_catalog: MetricDefinition | MetricDefinition[] | null;
};

const fetchMetricRows = unstable_cache(
  async ({ range }: MetricCacheKey): Promise<MetricRow[]> => {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');

    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      const { data, error } = await portal
        .from('metric_daily')
        .select('metric_date, metric_id, value, value_status, source, metric_catalog:metric_id(id, slug, label, unit, sort_order, is_active)')
        .gte('metric_date', since)
        .order('metric_date', { ascending: true });

      if (error) {
        console.error('Failed to load portal metrics', error);
        return [];
      }

      const rows = ((data ?? []) as unknown as MetricDailyRow[])
        .map((row) => ({
          metric_id: row.metric_id,
          metric_date: row.metric_date,
          value: row.value,
          value_status: row.value_status,
          metric_catalog: resolveMetricCatalogRelation(row.metric_catalog),
          source: row.source ?? null,
        }))
        .filter((row) => row.metric_catalog?.is_active !== false);

      return rows;
    } catch (error) {
      console.error('Unable to query portal metrics', error);
      return [];
    }
  },
  ['portal:metrics:rows'],
  {
    tags: [CACHE_TAGS.metrics],
    revalidate: METRIC_REVALIDATE_SECONDS,
  },
);

export async function getMetricRows(range: number, viewerId: string | null) {
  return fetchMetricRows({
    range,
    viewerId,
  });
}

export async function getMetricCards(range: number, viewerId: string | null): Promise<MetricCard[]> {
  const rows = await getMetricRows(range, viewerId);
  const grouped = groupMetrics(rows);
  return buildCardData(grouped);
}

export async function getMetricSummary(range: number, viewerId: string | null): Promise<string> {
  const rows = await getMetricRows(range, viewerId);
  const latest = computeLatestEntries(rows);
  return buildMetricSummary(latest);
}

export async function getMetricDataset(range: number, viewerId: string | null): Promise<MetricDataset> {
  const rows = await getMetricRows(range, viewerId);
  const entries = rows.map((row) => ({
    date: row.metric_date,
    key: row.metric_catalog?.slug ?? row.metric_id,
    metric_id: row.metric_id,
    label: row.metric_catalog?.label ?? row.metric_catalog?.slug ?? row.metric_id,
    unit: row.metric_catalog?.unit ?? null,
    value: typeof row.value === 'number' ? row.value : row.value === null ? null : Number(row.value),
    status: row.value_status,
    source: row.source,
    sortOrder: row.metric_catalog?.sort_order ?? 0,
  }));

  const latest = computeLatestEntries(rows);
  const summary = buildMetricSummary(latest);

  return {
    range: `${range}d`,
    entries,
    latest: latest.sort((a, b) => a.key.localeCompare(b.key)),
    summary,
  };
}

function resolveMetricCatalogRelation(
  relation: MetricDefinition | MetricDefinition[] | null,
): MetricDefinition | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation;
}

function groupMetrics(rows: MetricRow[]): Record<string, MetricRow[]> {
  return rows.reduce<Record<string, MetricRow[]>>((acc, row) => {
    if (!acc[row.metric_id]) acc[row.metric_id] = [];
    acc[row.metric_id].push(row);
    return acc;
  }, {});
}

export function groupMetricRows(rows: MetricRow[]) {
  return groupMetrics(rows);
}

function computeLatestEntries(rows: MetricRow[]) {
  const latestMap = new Map<
    string,
    {
      value: number | null;
      date: string;
      status: string;
      source: string | null;
      label: string;
      unit: string | null;
    }
  >();

  for (const row of rows) {
    const key = row.metric_catalog?.slug ?? row.metric_id;
    latestMap.set(key, {
      value: typeof row.value === 'number' ? row.value : row.value === null ? null : Number(row.value),
      date: row.metric_date,
      status: row.value_status,
      source: row.source,
      label: row.metric_catalog?.label ?? row.metric_catalog?.slug ?? row.metric_id,
      unit: row.metric_catalog?.unit ?? null,
    });
  }

  return Array.from(latestMap.entries()).map(([key, payload]) => ({
    key,
    value: payload.value,
    date: payload.date,
    status: payload.status,
    source: payload.source,
    label: payload.label,
    unit: payload.unit,
  }));
}

function buildCardData(grouped: Record<string, MetricRow[]>): MetricCard[] {
  const result: MetricCard[] = [];

  for (const series of Object.values(grouped)) {
    const ordered = [...series].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
    const latest = ordered.at(-1);
    if (!latest) continue;

    const definition = latest.metric_catalog;
    const label = definition?.label ?? definition?.slug ?? 'Metric';
    const unit = definition?.unit ?? null;
    const sortOrder = definition?.sort_order ?? 0;

    let value = 'Pending update';
    let description: string | undefined;

    if (latest.value_status === 'reported' && typeof latest.value === 'number') {
      value = formatMetricValue(latest.value, unit);
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

    result.push({
      key: definition?.id ?? latest.metric_id,
      label,
      value,
      caption: `Updated ${formatMetricDate(latest.metric_date)}`,
      description,
      status: latest.value_status,
      sortOrder,
    });
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildMetricSummary(
  latest: Array<{
    key: string;
    value: number | null;
    date: string;
    status: string;
    label: string;
  }>,
) {
  if (!latest.length) {
    return 'No metric data is available for the selected range yet.';
  }

  const reported = latest.filter((item) => item.status === 'reported' && item.value !== null);
  const pendingCount = latest.filter((item) => item.status === 'pending').length;

  const parts = reported.map((item) => `${item.label} reported ${item.value} on ${item.date}`);

  if (pendingCount > 0) {
    const label = pendingCount === 1 ? 'metric' : 'metrics';
    parts.push(`${pendingCount} ${label} awaiting update`);
  }

  return parts.length ? parts.join('; ') : 'Metrics recorded, but no numeric values available for summary.';
}

const numberFormatter = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

function formatMetricValue(value: number, unit?: string | null) {
  const formatted = Number.isInteger(value) ? value.toLocaleString('en-CA') : numberFormatter.format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatMetricDate(value: string) {
  return new Date(value).toLocaleDateString('en-CA');
}
