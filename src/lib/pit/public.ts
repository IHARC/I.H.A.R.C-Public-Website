import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

type PortalSchema = Database['portal'];

export type PitSummaryRow = PortalSchema['Views']['pit_public_summary']['Row'];
export type PitBreakdownRow = PortalSchema['Views']['pit_public_breakdowns']['Row'];

export type PitPublicDataset = {
  summaries: PitSummaryRow[];
  breakdowns: PitBreakdownRow[];
};

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

export type SupportSummary = {
  ready: number;
  needsFollowUp: number;
  declined: number;
  notSuitable: number;
  notAssessed: number;
};

export function buildSupportSummary(summary: PitSummaryRow): SupportSummary {
  return {
    ready: summary.ready_for_support_count,
    needsFollowUp: summary.follow_up_count,
    declined: summary.declined_support_count,
    notSuitable: summary.not_suitable_count,
    notAssessed: summary.unknown_support_count,
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
