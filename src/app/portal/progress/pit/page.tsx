import { BreakdownChart } from '@/components/pit/breakdown-chart';
import { TrendChart } from '@/components/portal/trend-chart';
import {
  buildTreatmentSummary,
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

  const summaries = sortSummariesByWindow(dataset.summaries);
  const breakdowns = dataset.breakdowns;
  const trendSeries = summaries.map((summary) => ({ date: formatTrendPoint(summary), value: summary.total_encounters }));
  const trendRangeLabel = buildTrendRangeLabel(summaries);
  const latest = pickFeaturedSummary(summaries);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 text-on-surface">
      <header className="space-y-4 rounded-3xl border border-outline/10 bg-surface p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Point-in-Time Outreach</p>
        <h1 className="text-3xl font-bold tracking-tight">Weekly point-in-time counts</h1>
        <p className="text-sm text-on-surface-variant">
          IHARC coordinates Cobourg point-in-time counts with neighbours and our outreach teams. These outreach snapshots focus on people sleeping outdoors—they do not include Transition House shelter residents or neighbours couch surfing or doubling up with friends. Every entry is anonymized before it reaches this dashboard so you can plan staffing, follow-up visits, and overdose response coverage.
        </p>
        <p className="text-sm font-semibold text-error">
          In an emergency call 911. The Good Samaritan Drug Overdose Act protects you and the person you&apos;re helping when you call for an overdose.
        </p>
        <p className="text-sm text-on-surface-variant">
          Need to coordinate outside the count window? Email <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a> so the outreach lead can loop you in.
        </p>
      </header>

      {trendSeries.length ? (
        <TrendChart
          title="Neighbours counted across Cobourg point-in-time windows"
          description="Totals reflect Cobourg outdoor encounters only, helping partners see whether weekly canvasses are reaching consistent numbers of neighbours."
          data={trendSeries}
          rangeLabel={trendRangeLabel}
        />
      ) : null}

      {summaries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline/40 bg-surface p-8 text-sm text-on-surface-variant">
          The first point-in-time count is being validated and will appear here once stewards finish the quality review.
        </div>
      ) : null}

      <div className="space-y-10">
        {summaries.map((summary) => {
          const groups = groupBreakdownsForCount(breakdowns, summary.id);
          const chart = (dimension: string) => toChartData(groups.find((group) => group.dimension === dimension)?.rows ?? []);

          return (
            <section key={summary.id} className="space-y-6 rounded-3xl border border-outline/10 bg-surface p-8 shadow-sm">
              <header className="flex flex-col gap-3 text-balance lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-on-surface">{formatRange(summary)}</h2>
                  <p className="text-sm text-on-surface-variant">
                    {summary.description ??
                      'Partners completed Cobourg canvasses and logged each outdoor encounter once the neighbour consented. Totals exclude Transition House residents and neighbours staying temporarily with friends or family.'}
                  </p>
                </div>
                <StatusBadge summary={summary} />
              </header>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {buildMetricCards(summary).map((card) => (
                  <div key={card.label} className="rounded-2xl border border-outline/20 bg-surface-container-high p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-on-surface">{card.value}</p>
                    <p className="mt-1 text-xs text-on-surface-variant/90">{card.caption}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart
                  title="Wants treatment"
                  description="Shows how many neighbours were ready to connect immediately, needed extra support, or declined for now."
                  data={chart('wants_treatment')}
                />
                <BreakdownChart
                  title="Age distribution"
                  description="Age categories help us match warming centres, shelter beds, and case work to the right demographics."
                  data={chart('age_bracket')}
                />
                <BreakdownChart
                  title="Addiction severity"
                  description="Outreach teams note when neighbours share higher-risk substance use so we can prioritise naloxone drops and warm referrals."
                  data={chart('addiction_severity')}
                />
                <BreakdownChart
                  title="Mental health severity"
                  description="Flags help outreach leads line up next visits where neighbours described acute mental health concerns."
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

function buildMetricCards(summary: PitSummaryRow) {
  const treatment = buildTreatmentSummary(summary);
  const total = summary.total_encounters || 0;

  return [
    {
      label: 'Neighbours counted',
      value: formatCount(total),
      caption: formatPitDateRange(summary),
    },
    {
      label: 'Ready for treatment now',
      value: formatCount(treatment.readyNow),
      caption: formatSupportRate(treatment.readyNow, total),
    },
    {
      label: 'Ready with supports',
      value: formatCount(treatment.readyWithSupports),
      caption: formatSupportRate(treatment.readyWithSupports, total),
    },
    {
      label: 'Needs follow-up',
      value: formatCount(treatment.needsFollowUp),
      caption: formatSupportRate(treatment.needsFollowUp, total),
    },
    {
      label: 'Declined today',
      value: formatCount(treatment.declined),
      caption: formatSupportRate(treatment.declined, total),
    },
    {
      label: 'Addiction severity flagged',
      value: formatCount(summary.addiction_positive_count),
      caption: 'Inform naloxone + RAAM coverage',
    },
    {
      label: 'Mental health severity flagged',
      value: formatCount(summary.mental_health_positive_count),
      caption: 'Guide follow-up outreach visits',
    },
  ];
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

function StatusBadge({ summary }: { summary: PitSummaryRow }) {
  const inProgress = isPitCountInProgress(summary);
  const label = inProgress ? 'In progress' : summary.status === 'closed' ? 'Closed' : 'Planned';
  const background = inProgress ? 'bg-primary/10 text-primary' : 'bg-outline/10 text-on-surface-variant';

  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${background}`}>{label}</span>
  );
}
