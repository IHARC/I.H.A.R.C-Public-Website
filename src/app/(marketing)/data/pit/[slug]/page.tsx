import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BreakdownChart } from '@/components/pit/breakdown-chart';
import {
  buildTreatmentSummary,
  formatCount,
  formatPitDateRange,
  formatSupportRate,
  groupBreakdownsForCount,
  isPitCountInProgress,
  loadPitCountBySlug,
  toChartData,
} from '@/lib/pit/public';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PitCountPage({ params }: { params: RouteParams }) {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    notFound();
  }

  const supabase = await createSupabaseRSCClient();
  const { summary, breakdowns } = await loadPitCountBySlug(supabase, slug);

  if (!summary) {
    notFound();
  }

  const treatment = buildTreatmentSummary(summary);
  const total = summary.total_encounters || 0;
  const breakdownGroups = groupBreakdownsForCount(breakdowns, summary.id);
  const chartFor = (dimension: string) => toChartData(breakdownGroups.find((group) => group.dimension === dimension)?.rows ?? []);

  const ageChart = chartFor('age_bracket');
  const genderChart = chartFor('gender');
  const locationChart = chartFor('location_type');
  const addictionChart = chartFor('addiction_severity');
  const mentalHealthChart = chartFor('mental_health_severity');
  const treatmentChart = chartFor('wants_treatment');

  const stats = [
    {
      label: 'Ready for treatment now',
      value: treatment.readyNow,
      rate: formatSupportRate(treatment.readyNow, total),
    },
    {
      label: 'Ready with supports',
      value: treatment.readyWithSupports,
      rate: formatSupportRate(treatment.readyWithSupports, total),
    },
    {
      label: 'Needs follow-up',
      value: treatment.needsFollowUp,
      rate: formatSupportRate(treatment.needsFollowUp, total),
    },
    {
      label: 'Declined today',
      value: treatment.declined,
      rate: formatSupportRate(treatment.declined, total),
    },
    {
      label: 'Not suitable',
      value: treatment.notSuitable,
      rate: formatSupportRate(treatment.notSuitable, total),
    },
    {
      label: 'Not yet assessed / unknown',
      value: treatment.notAssessed + treatment.unknown,
      rate: formatSupportRate(treatment.notAssessed + treatment.unknown, total),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <nav className="text-sm">
        <Link href="/data" className="text-primary underline-offset-2 hover:underline">
          ← Back to Community Data
        </Link>
      </nav>

      <header className="space-y-4 rounded-3xl border border-outline/10 bg-surface p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">{formatPitDateRange(summary)}</p>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">{summary.title || 'Point-in-time outreach count'}</h1>
            <p className="text-sm text-on-surface-variant">
              {summary.description ??
                'Neighbours volunteered anonymised responses while outreach teams offered supports across Cobourg outdoor routes. Totals exclude Transition House shelter residents and neighbours couch surfing or temporarily staying with friends or family.'}
            </p>
          </div>
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold ${
              isPitCountInProgress(summary)
                ? 'bg-primary/10 text-primary'
                : 'bg-outline/10 text-on-surface-variant'
            }`}
          >
            {isPitCountInProgress(summary) ? 'In Progress' : 'Completed'}
          </span>
        </div>
        <p className="text-sm font-semibold text-error">
          In an emergency call 911. The Good Samaritan Drug Overdose Act protects the caller and the person experiencing an overdose.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Treatment interest snapshot</h2>
        <p className="text-sm text-on-surface-variant">
          Totals below represent the {formatCount(total)} neighbours encountered during this count window. Percentages reflect each group&apos;s share of those encounters.
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
            <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Neighbours counted</dt>
            <dd className="mt-2 text-lg font-semibold text-on-surface">{formatCount(total)}</dd>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
            <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Substance use supports flagged</dt>
            <dd className="mt-2 text-lg font-semibold text-on-surface">{formatCount(summary.addiction_positive_count)}</dd>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
            <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Mental health follow-ups</dt>
            <dd className="mt-2 text-lg font-semibold text-on-surface">{formatCount(summary.mental_health_positive_count)}</dd>
          </div>
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
              <dt className="text-xs uppercase tracking-wide text-on-surface-variant">{stat.label}</dt>
              <dd className="mt-2 text-lg font-semibold text-on-surface">
                {formatCount(stat.value)}
                <span className="ml-2 text-xs font-normal text-on-surface-variant">{stat.rate}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Breakdowns</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <BreakdownChart
            title="Age distribution"
            description="Counts reflect neighbours who consented to share their age bracket during the outreach window."
            data={ageChart}
          />
          <BreakdownChart
            title="Gender identity"
            description="Neighbours self-identify, and outreach teams only log what people are comfortable sharing."
            data={genderChart}
          />
          <BreakdownChart
            title="Wants treatment"
            description="Shows how many neighbours wanted treatment now, with supports, or preferred a follow-up later."
            data={treatmentChart}
          />
          <BreakdownChart
            title="Where we connected"
            description="Location types guide canopy routes, motel supports, and shelter co-ordination."
            data={locationChart}
          />
          <BreakdownChart
            title="Substance use supports"
            description="Severity is only logged when a neighbour requests or accepts substance use support; other encounters are marked as not applicable."
            data={addictionChart}
          />
          <BreakdownChart
            title="Mental health supports"
            description="Help planning ensures clinical partners focus their warm hand-offs where neighbours asked for it."
            data={mentalHealthChart}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-outline/10 bg-surface-container p-6 text-sm text-on-surface-variant">
        <p className="font-semibold text-on-surface">Need follow-up data?</p>
        <p className="mt-2">
          Moderators can share additional anonymised summaries with partner agencies. Email <a href="mailto:outreach@iharc.ca" className="font-medium text-primary underline">outreach@iharc.ca</a> with the count slug and the specific context you need.
        </p>
      </section>
    </div>
  );
}
