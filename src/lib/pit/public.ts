import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

type PortalSchema = Database['portal'];

export type PitSummaryRow = PortalSchema['Views']['pit_public_summary']['Row'];
export type PitBreakdownRow = PortalSchema['Views']['pit_public_breakdowns']['Row'];

export type PitPublicDataset = {
  summaries: PitSummaryRow[];
  breakdowns: PitBreakdownRow[];
  refreshedAt: string;
};

export async function loadPitCountBySlug(
  client: SupabaseClient<Database>,
  slug: string,
): Promise<{ summary: PitSummaryRow | null; breakdowns: PitBreakdownRow[]; refreshedAt: string }> {
  const portal = client.schema('portal');

  const { data: summaryData, error: summaryError } = await portal
    .from('pit_public_summary')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (summaryError) throw summaryError;

  const summary = (summaryData ?? null) as PitSummaryRow | null;
  if (!summary) {
    return { summary: null, breakdowns: [], refreshedAt: new Date().toISOString() };
  }

  const { data: breakdownData, error: breakdownError } = await portal
    .from('pit_public_breakdowns')
    .select('*')
    .eq('pit_count_id', summary.id);

  if (breakdownError) throw breakdownError;

  return {
    summary,
    breakdowns: (breakdownData ?? []) as PitBreakdownRow[],
    refreshedAt: new Date().toISOString(),
  };
}

export async function loadPitPublicDataset(client: SupabaseClient<Database>): Promise<PitPublicDataset> {
  const portal = client.schema('portal');

  const [summaryResult, breakdownResult] = await Promise.all([
    portal.from('pit_public_summary').select('*').order('observed_start', { ascending: true }),
    portal.from('pit_public_breakdowns').select('*'),
  ]);

  if (summaryResult.error) {
    throw summaryResult.error;
  }

  if (breakdownResult.error) {
    throw breakdownResult.error;
  }

  return {
    summaries: (summaryResult.data ?? []) as PitSummaryRow[],
    breakdowns: (breakdownResult.data ?? []) as PitBreakdownRow[],
    refreshedAt: new Date().toISOString(),
  };
}

export function sortSummariesByWindow(entries: PitSummaryRow[]): PitSummaryRow[] {
  return [...entries].sort((a, b) => {
    const aDate = a.observed_start ?? a.last_observation_at ?? '';
    const bDate = b.observed_start ?? b.last_observation_at ?? '';
    return aDate.localeCompare(bDate);
  });
}

export function pickFeaturedSummary(entries: PitSummaryRow[]): PitSummaryRow | null {
  if (!entries.length) return null;

  const active = entries.find((entry) => entry.is_active);
  if (active) return active;

  return sortSummariesByWindow(entries).at(-1) ?? null;
}

export type PitDimensionGroup = {
  dimension: PitBreakdownRow['dimension'];
  label: PitBreakdownRow['dimension_label'];
  rows: PitBreakdownRow[];
};

export function groupBreakdownsForCount(
  breakdowns: PitBreakdownRow[],
  pitCountId: string,
): PitDimensionGroup[] {
  const scoped = breakdowns.filter((entry) => entry.pit_count_id === pitCountId);

  const grouped = scoped.reduce<Record<string, PitDimensionGroup>>((acc, entry) => {
    if (!acc[entry.dimension]) {
      acc[entry.dimension] = {
        dimension: entry.dimension,
        label: entry.dimension_label,
        rows: [],
      };
    }

    acc[entry.dimension].rows.push(entry);
    return acc;
  }, {});

  return Object.values(grouped)
    .map((group) => ({
      ...group,
      rows: [...group.rows].sort((a, b) => a.bucket_sort - b.bucket_sort),
    }))
    .sort((a, b) => a.rows[0]?.dimension_sort - b.rows[0]?.dimension_sort);
}

export type ChartDatum = {
  key: string;
  label: string;
  value: number | null;
  percentage: number | null;
  suppressed: boolean;
  suppressedReason?: string | null;
};

export function toChartData(rows: PitBreakdownRow[]): ChartDatum[] {
  return rows.map((row) => ({
    key: row.bucket,
    label: row.bucket_label,
    value: row.total,
    percentage: row.percentage,
    suppressed: row.suppressed,
    suppressedReason: row.suppressed_reason,
  }));
}

export type TreatmentInterestSummary = {
  yes: number;
  no: number;
  notSuitable: number;
  notApplicable: number;
};

export function buildTreatmentSummary(summary: PitSummaryRow): TreatmentInterestSummary {
  return {
    yes: summary.wants_treatment_yes_count,
    no: summary.wants_treatment_no_count,
    notSuitable: summary.wants_treatment_not_suitable_count,
    notApplicable: summary.wants_treatment_not_applicable_count,
  };
}

export function formatSupportRate(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-CA');
}

export const MIN_PUBLIC_CELL = 3;

export function formatPitDateRange(summary: Pick<PitSummaryRow, 'observed_start' | 'observed_end' | 'last_observation_at'>): string {
  const start = formatDate(summary.observed_start ?? summary.last_observation_at);
  const end = summary.observed_end ? formatDate(summary.observed_end) : null;
  if (!start && !end) return 'Date to be confirmed';
  if (start && !end) return `${start} onward`;
  if (!start && end) return `through ${end}`;
  return `${start} – ${end}`;
}

export function isPitCountInProgress(summary: PitSummaryRow): boolean {
  if (summary.is_active) return true;
  if (!summary.observed_end) return true;
  const endDate = new Date(summary.observed_end);
  return Number.isFinite(endDate.getTime()) && endDate.getTime() > Date.now();
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsed);
}
