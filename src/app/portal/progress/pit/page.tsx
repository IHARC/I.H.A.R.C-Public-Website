import { Activity, HeartPulse, Home, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BreakdownChart } from '@/components/pit/breakdown-chart';
import { PitStatusBadge } from '@/components/pit/status-badge';
import { TrendChart } from '@/components/portal/trend-chart';
import { Progress } from '@/components/ui/progress';
import {
  buildTreatmentSummary,
  describePitStatus,
  formatCount,
  formatPitDateRange,
  formatSupportRate,
  groupBreakdownsForCount,
  isPitCountInProgress,
  loadPitPublicDataset,
  pickFeaturedSummary,
  sortSummariesByWindow,
  toChartData,
} from '@/lib/pit/public';
import type { PitSummaryRow } from '@/lib/pit/public';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';

export const dynamic = 'force-dynamic';

export default async function PitProgressPage() {
  const supabase = await createSupabaseRSCClient();
  const dataset = await loadPitPublicDataset(supabase);

  const chronologicalSummaries = sortSummariesByWindow(dataset.summaries);
  const summaries = [...chronologicalSummaries].reverse();
  const breakdowns = dataset.breakdowns;
  const refreshedAt = dataset.refreshedAt ?? new Date().toISOString();
  const trendSeries = chronologicalSummaries.map((summary) => ({ date: formatTrendPoint(summary), value: summary.total_encounters }));
  const trendRangeLabel = buildTrendRangeLabel(chronologicalSummaries);
  const latest = pickFeaturedSummary(chronologicalSummaries);
  const latestIndex = latest ? chronologicalSummaries.findIndex((entry) => entry.id === latest.id) : -1;
  const previousLatest = latestIndex > 0 ? chronologicalSummaries[latestIndex - 1] : null;
  const highlightCards = latest ? buildHighlightCards(latest, previousLatest) : [];
  const showTrend = trendSeries.length > 0;
  const showTreatmentReadiness = Boolean(latest);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 text-on-surface">
      <header className="space-y-6 rounded-3xl border border-outline/10 bg-surface p-8 shadow-sm">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Point-in-Time Outreach</p>
          <h1 className="text-3xl font-bold tracking-tight">Weekly point-in-time counts</h1>
          <p className="text-sm text-on-surface-variant">
            IHARC coordinates Cobourg point-in-time counts alongside volunteers. These outreach snapshots focus on people sleeping outdoors—they do not include Transition House shelter residents or people couch surfing or doubling up with friends. Every entry is anonymized before it reaches this dashboard. 
          </p>
          <p className="text-sm font-semibold text-error">
            In an emergency call 911. The Good Samaritan Drug Overdose Act protects you and the person you&apos;re helping when you call for an overdose.
          </p>
          <p className="text-sm text-on-surface-variant">
            Need to coordinate outside the count window? Email <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a> so the outreach lead can loop you in.
          </p>
        </div>
        {highlightCards.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {highlightCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.key} className="rounded-2xl border border-outline/10 bg-surface-container-high p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">{card.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-on-surface">{card.value}</p>
                    </div>
                    <Icon aria-hidden className="h-6 w-6 text-primary" />
                  </div>
                  {card.change ? (
                    <span className="mt-3 inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface">
                      {card.change}
                    </span>
                  ) : null}
                  <p className="mt-3 text-xs text-on-surface-variant/90">{card.caption}</p>
                </article>
              );
            })}
          </div>
        ) : null}
      </header>

      {showTrend ? (
        showTreatmentReadiness && latest ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <TrendChart
              title="Neighbours counted across Cobourg point-in-time windows"
              description="Totals reflect Cobourg outdoor encounters only, helping partners see whether weekly canvasses are reaching consistent numbers of people."
              data={trendSeries}
              rangeLabel={trendRangeLabel}
            />
            <TreatmentReadinessCard summary={latest} />
          </div>
        ) : (
          <TrendChart
            title="Neighbours counted across Cobourg point-in-time windows"
            description="Totals reflect Cobourg outdoor encounters only, helping partners see whether weekly canvasses are reaching consistent numbers of people."
            data={trendSeries}
            rangeLabel={trendRangeLabel}
          />
        )
      ) : null}

      {chronologicalSummaries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline/40 bg-surface p-8 text-sm text-on-surface-variant">
          The first point-in-time count is being validated and will appear here.
        </div>
      ) : null}

      <div className="space-y-10">
        {summaries.map((summary) => {
          const groups = groupBreakdownsForCount(breakdowns, summary.id);
          const chart = (dimension: string) => toChartData(groups.find((group) => group.dimension === dimension)?.rows ?? []);
          const previousSummary = findPreviousSummary(chronologicalSummaries, summary.id);
          const metricCards = buildMetricCards(summary, previousSummary);

          return (
            <section key={summary.id} className="space-y-6 rounded-3xl border border-outline/10 bg-surface p-8 shadow-sm">
              <header className="flex flex-col gap-3 text-balance lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-on-surface">{formatRange(summary)}</h2>
                  <p className="text-sm text-on-surface-variant">
                    {summary.description ??
                      'Partners completed Cobourg canvasses and logged each outdoor encounter once people consented. Totals exclude Transition House residents and individuals staying temporarily with friends or family.'}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-on-surface-variant lg:items-end">
                  <PitStatusBadge summary={summary} size="md" />
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-surface-container px-4 py-1 text-xs font-medium">
                    Updated {formatLastUpdated(refreshedAt)}
                  </span>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => (
                  <article key={card.label} className="rounded-2xl border border-outline/15 bg-surface-container-high p-5 shadow-sm transition-shadow hover:shadow-md">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-on-surface">{card.value}</p>
                    {card.changeLabel ? (
                      <span className="mt-2 inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface">
                        {card.changeLabel}
                      </span>
                    ) : null}
                    <p className="mt-2 text-xs text-on-surface-variant/90">{card.caption}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart
                  title="Wants treatment"
                  description="Shows how many respondents said yes, no, were not suitable, or did not require treatment during the outreach window."
                  data={chart('wants_treatment')}
                />
                <BreakdownChart
                  title="Age distribution"
                  description="Age categories help us match warming centres, shelter beds, and case work to the right demographics."
                  data={chart('age_bracket')}
                />
                <BreakdownChart
                  title="Addiction severity"
                  description="Outreach teams note when respondents share higher-risk substance use so naloxone drops and warm referrals can be prioritised."
                  data={chart('addiction_severity')}
                />
                <BreakdownChart
                  title="Mental health severity"
                  description="Flags help outreach leads line up next visits where respondents described acute mental health concerns."
                  data={chart('mental_health_severity')}
                />
              </div>
            </section>
          );
        })}
      </div>

      {latest ? (
        <footer className="rounded-3xl border border-outline/10 bg-surface p-6 text-sm text-on-surface-variant">
          <p className="font-semibold text-on-surface">
            Quick contacts
          </p>
          <ul className="mt-2 space-y-1">
            <li>In an emergency call 911 immediately.</li>
            <li>RAAM Clinic: Tuesdays, 12–3&nbsp;pm, 1011 Elgin St. W.</li>
            <li>Outreach coordination: <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a></li>
          </ul>
        </footer>
      ) : null}
    </div>
  );
}

type MetricCard = {
  label: string;
  value: string;
  caption: string;
  changeLabel: string | null;
};

function buildMetricCards(summary: PitSummaryRow, previous: PitSummaryRow | null): MetricCard[] {
  const treatment = buildTreatmentSummary(summary);
  const total = summary.total_encounters || 0;
  const unsheltered = summary.homelessness_confirmed_count || 0;
  const previousTotals = previous?.total_encounters ?? null;
  const previousUnsheltered = previous?.homelessness_confirmed_count ?? null;
  const previousAddiction = previous?.addiction_positive_count ?? null;
  const previousMentalHealth = previous?.mental_health_positive_count ?? null;
  const previousYes = previous?.wants_treatment_yes_count ?? null;
  const previousNo = previous?.wants_treatment_no_count ?? null;
  const previousNotSuitable = previous?.wants_treatment_not_suitable_count ?? null;
  const previousNotApplicable = previous?.wants_treatment_not_applicable_count ?? null;

  return [
    {
      label: 'People engaged',
      value: formatCount(total),
      caption: formatPitDateRange(summary),
      changeLabel: formatChangeLabel(total, previousTotals),
    },
    {
      label: 'Actively living outside',
      value: formatCount(unsheltered),
      caption: formatSupportRate(unsheltered, total),
      changeLabel: formatChangeLabel(unsheltered, previousUnsheltered),
    },
    {
      label: 'Identified substance use / addictions',
      value: formatCount(summary.addiction_positive_count),
      caption: formatSupportRate(summary.addiction_positive_count, total),
      changeLabel: formatChangeLabel(summary.addiction_positive_count, previousAddiction),
    },
    {
      label: 'Severe mental health conditions',
      value: formatCount(summary.mental_health_positive_count),
      caption: formatSupportRate(summary.mental_health_positive_count, total),
      changeLabel: formatChangeLabel(summary.mental_health_positive_count, previousMentalHealth),
    },
    {
      label: 'Said yes to treatment',
      value: formatCount(treatment.yes),
      caption: formatSupportRate(treatment.yes, total),
      changeLabel: formatChangeLabel(treatment.yes, previousYes),
    },
    {
      label: 'Said no to treatment',
      value: formatCount(treatment.no),
      caption: formatSupportRate(treatment.no, total),
      changeLabel: formatChangeLabel(treatment.no, previousNo),
    },
    {
      label: 'Not suitable for treatment',
      value: formatCount(treatment.notSuitable),
      caption: formatSupportRate(treatment.notSuitable, total),
      changeLabel: formatChangeLabel(treatment.notSuitable, previousNotSuitable),
    },
    {
      label: 'Not applicable (no addiction risk)',
      value: formatCount(treatment.notApplicable),
      caption: formatSupportRate(treatment.notApplicable, total),
      changeLabel: formatChangeLabel(treatment.notApplicable, previousNotApplicable),
    },
  ];
}

type HighlightCard = {
  key: string;
  label: string;
  value: string;
  caption: string;
  change: string | null;
  icon: LucideIcon;
};

function buildHighlightCards(latest: PitSummaryRow, previous: PitSummaryRow | null): HighlightCard[] {
  const total = latest.total_encounters || 0;
  const unsheltered = latest.homelessness_confirmed_count || 0;
  const treatment = buildTreatmentSummary(latest);
  const mentalHealth = latest.mental_health_positive_count || 0;
  const status = describePitStatus(latest);
  const showChange = status.code !== 'scheduled';
  const range = formatPitDateRange(latest);
  const totalCaption =
    status.code === 'active' ? `Active window ${range}` : status.code === 'scheduled' ? `Scheduled for ${range}` : `Window ${range}`;
  const awaitingCaption = status.code === 'scheduled' ? 'Data will publish after canvass responses are collected.' : null;

  return [
    {
      key: 'total',
      label: 'Neighbours engaged',
      value: formatCount(total),
      caption: awaitingCaption ? `${totalCaption}. ${awaitingCaption}` : totalCaption,
      change: showChange ? formatChangeLabel(total, previous?.total_encounters ?? null) : null,
      icon: Users,
    },
    {
      key: 'unsheltered',
      label: 'Confirmed unsheltered',
      value: formatCount(unsheltered),
      caption:
        awaitingCaption ?? `${formatSupportRate(unsheltered, total)} of everyone contacted`,
      change: showChange ? formatChangeLabel(unsheltered, previous?.homelessness_confirmed_count ?? null) : null,
      icon: Home,
    },
    {
      key: 'treatment-yes',
      label: 'Ready for treatment support',
      value: formatCount(treatment.yes),
      caption: awaitingCaption ?? `${formatSupportRate(treatment.yes, total)} asked for help`,
      change: showChange ? formatChangeLabel(treatment.yes, previous?.wants_treatment_yes_count ?? null) : null,
      icon: Activity,
    },
    {
      key: 'mental-health',
      label: 'Urgent mental health follow-ups',
      value: formatCount(mentalHealth),
      caption:
        awaitingCaption ?? `${formatSupportRate(mentalHealth, total)} shared acute mental health needs`,
      change: showChange ? formatChangeLabel(mentalHealth, previous?.mental_health_positive_count ?? null) : null,
      icon: HeartPulse,
    },
  ];
}

function formatChangeLabel(current: number, previous: number | null | undefined): string | null {
  if (typeof previous !== 'number') return null;
  const diff = current - previous;
  if (diff === 0) return 'No change vs last count';
  const sign = diff > 0 ? '+' : '-';
  return `${sign}${Math.abs(diff).toLocaleString('en-CA')} vs last count`;
}

function formatRange(summary: PitSummaryRow): string {
  const label = formatPitDateRange(summary);
  return isPitCountInProgress(summary) ? `${label} (in progress)` : label;
}

function formatTrendPoint(summary: PitSummaryRow): string {
  const candidate = summary.observed_end ?? summary.last_observation_at ?? summary.observed_start;
  return formatDate(candidate, { month: 'short', day: 'numeric' }) ?? 'TBD';
}

function buildTrendRangeLabel(entries: PitSummaryRow[]): string {
  if (!entries.length) return 'Awaiting first count';
  const first = entries[0];
  const last = entries[entries.length - 1];
  const start = formatDate(first.observed_start ?? first.last_observation_at, { month: 'short', year: 'numeric' }) ?? 'start';
  const end = formatDate(last.observed_end ?? last.last_observation_at, { month: 'short', year: 'numeric' }) ?? 'present';
  return start === end ? `${start} count` : `${start} – ${end}`;
}

function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', options ?? { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

function formatLastUpdated(value: string | null): string {
  if (!value) return 'recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'recently';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(parsed);
}

function TreatmentReadinessCard({ summary }: { summary: PitSummaryRow }) {
  const totals = summary.total_encounters || 0;
  const treatment = buildTreatmentSummary(summary);
  const awaitingData = totals === 0;
  const items = [
    {
      key: 'yes',
      label: 'Said yes to treatment',
      value: treatment.yes,
    },
    {
      key: 'no',
      label: 'Declined treatment',
      value: treatment.no,
    },
    {
      key: 'not-suitable',
      label: 'Not suitable right now',
      value: treatment.notSuitable,
    },
    {
      key: 'not-applicable',
      label: 'No addiction risk reported',
      value: treatment.notApplicable,
    },
  ];

  return (
    <section className="flex h-full flex-col rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-on-surface">Treatment interest snapshot</h2>
        <p className="text-sm text-on-surface-variant">
          Summarises how neighbours responded to treatment offers during the most recent canvass.
        </p>
      </header>
      <ul className="mt-6 flex flex-col gap-4">
        {items.map((item) => {
          const percentage = totals ? Math.round((item.value / totals) * 100) : 0;
          return (
            <li key={item.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-on-surface">{item.label}</span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  {formatCount(item.value)} ({formatSupportRate(item.value, totals)})
                </span>
              </div>
              <Progress
                value={percentage}
                className="mt-2 h-2 rounded-full bg-surface-container-high"
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-on-surface-variant/90">
        {awaitingData
          ? 'Counts will populate as soon as canvass responses are logged.'
          : `Percentages reflect ${formatCount(totals)} neighbours engaged during this outreach window.`}
      </p>
    </section>
  );
}

function findPreviousSummary(entries: PitSummaryRow[], id: string): PitSummaryRow | null {
  const index = entries.findIndex((entry) => entry.id === id);
  if (index > 0) return entries[index - 1];
  return null;
}
