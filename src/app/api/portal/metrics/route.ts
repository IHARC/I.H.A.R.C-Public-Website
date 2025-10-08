import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

const RANGE_OPTIONS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
};

export async function GET(req: NextRequest) {
  const rangeParam = req.nextUrl.searchParams.get('range');
  const days = RANGE_OPTIONS[rangeParam ?? ''] ?? 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceDate = since.toISOString().slice(0, 10);

  const supabase = await createSupabaseServerClient();
  const portal = supabase.schema('portal');
  const { data, error } = await portal
    .from('metric_daily')
    .select('metric_date, metric_id, value, value_status, source, metric_catalog:metric_id(id, slug, label, unit, sort_order, is_active)')
    .gte('metric_date', sinceDate)
    .order('metric_date', { ascending: true });

  if (error) {
    console.error('Failed to load metrics', error);
    return NextResponse.json({ error: 'Unable to load metrics' }, { status: 500 });
  }

  type MetricDefinition = Database['portal']['Tables']['metric_catalog']['Row'];
  type MetricDailyRow = Database['portal']['Tables']['metric_daily']['Row'] & {
    metric_catalog: MetricDefinition | MetricDefinition[] | null;
  };

  const rows = ((data ?? []) as unknown as MetricDailyRow[])
    .map((row) => {
      const definition = resolveMetricCatalogRelation(row.metric_catalog);
      return {
        metric_date: row.metric_date,
        metric_id: row.metric_id,
        value: row.value,
        value_status: row.value_status,
        source: row.source ?? null,
        metric_catalog: definition,
      };
    })
    .filter((row) => row.metric_catalog?.is_active !== false);

  const entries = rows.map((row) => {
    const definition = row.metric_catalog;
    const value =
      typeof row.value === 'number' ? row.value : row.value === null ? null : Number(row.value);

    return {
      date: row.metric_date,
      key: definition?.slug ?? row.metric_id,
      metric_id: row.metric_id,
      label: definition?.label ?? definition?.slug ?? row.metric_id,
      unit: definition?.unit ?? null,
      value,
      status: row.value_status,
      source: row.source ?? null,
      sortOrder: definition?.sort_order ?? 0,
    };
  });

  const latestMap = new Map<
    string,
    { value: number | null; date: string; status: string; source: string | null; label: string; unit: string | null }
  >();

  for (const entry of entries) {
    latestMap.set(entry.key, {
      value: entry.value,
      date: entry.date,
      status: entry.status,
      source: entry.source,
      label: entry.label,
      unit: entry.unit,
    });
  }

  const latest = Array.from(latestMap.entries()).map(([key, payload]) => ({
    key,
    date: payload.date,
    value: payload.value,
    status: payload.status,
    label: payload.label,
    unit: payload.unit,
    source: payload.source,
  }));

  const summary = buildSummary(latest);

  return NextResponse.json({
    range: `${days}d`,
    entries,
    latest: latest.sort((a, b) => a.key.localeCompare(b.key)),
    summary,
  });
}

function buildSummary(
  latest: Array<{
    key: string;
    value: number | null;
    date: string;
    status: string;
    label?: string;
  }>,
) {
  if (!latest.length) {
    return 'No metric data is available for the selected range yet.';
  }

  const reported = latest.filter((item) => item.status === 'reported' && item.value !== null);
  const pendingCount = latest.filter((item) => item.status === 'pending').length;

  const parts = reported.map(
    (item) =>
      `${(item.label ?? formatMetricKey(item.key))} reported ${item.value} on ${item.date}`,
  );

  if (pendingCount > 0) {
    const label = pendingCount === 1 ? 'metric' : 'metrics';
    parts.push(`${pendingCount} ${label} awaiting update`);
  }

  return parts.length ? parts.join('; ') : 'Metrics recorded, but no numeric values available for summary.';
}

function formatMetricKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveMetricCatalogRelation(
  relation: Database['portal']['Tables']['metric_catalog']['Row'] | Database['portal']['Tables']['metric_catalog']['Row'][] | null,
): Database['portal']['Tables']['metric_catalog']['Row'] | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation;
}
