import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
    .select('metric_date, metric_key, value, source')
    .gte('metric_date', sinceDate)
    .order('metric_date', { ascending: true });

  if (error) {
    console.error('Failed to load metrics', error);
    return NextResponse.json({ error: 'Unable to load metrics' }, { status: 500 });
  }

  const entries = (data ?? []).map((row) => ({
    date: row.metric_date,
    key: row.metric_key,
    value: typeof row.value === 'number' ? row.value : row.value === null ? null : Number(row.value),
    source: row.source ?? null,
  }));

  const latestMap = new Map<
    string,
    { value: number | null; date: string; source: string | null }
  >();

  for (const entry of entries) {
    latestMap.set(entry.key, {
      value: entry.value,
      date: entry.date,
      source: entry.source,
    });
  }

  const latest = Array.from(latestMap.entries()).map(([key, payload]) => ({
    key,
    date: payload.date,
    value: payload.value,
    source: payload.source,
  }));

  const summary = buildSummary(latest);

  return NextResponse.json({
    range: `${days}d`,
    entries,
    latest,
    summary,
  });
}

function buildSummary(latest: Array<{ key: string; value: number | null; date: string }>) {
  if (!latest.length) {
    return 'No metric data is available for the selected range yet.';
  }

  const parts = latest
    .filter((item) => item.value !== null)
    .map((item) => `${formatMetricKey(item.key)} reported ${item.value} on ${item.date}`);

  return parts.length ? parts.join('; ') : 'Metrics recorded, but no numeric values available for summary.';
}

function formatMetricKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
