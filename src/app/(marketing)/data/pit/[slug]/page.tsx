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
  toChartData,
} from '@/lib/pit/public';
import { getPitCountBySlug } from '@/data/pit';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PitCountPage({ params }: { params: RouteParams }) {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    notFound();
  }

  const { summary, breakdowns } = await getPitCountBySlug(slug);

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

  const unsheltered = summary.homelessness_confirmed_count || 0;
  const withoutSevereAddiction = Math.max(unsheltered - summary.addiction_positive_count, 0);
  const shareOfUnsheltered = (value: number) => (unsheltered ? formatSupportRate(value, unsheltered) : '0%');

  const cards = [
    {
      label: 'Neighbours counted',
      value: formatCount(total),
    },
    {
      label: 'Said yes to treatment',
      value: formatCount(treatment.yes),
      rate: formatSupportRate(treatment.yes, total),
    },
    {
      label: 'Said no to treatment',
      value: formatCount(treatment.no),
      rate: formatSupportRate(treatment.no, total),
    },
    {
      label: 'Not suitable for treatment',
      value: formatCount(treatment.notSuitable),
      rate: formatSupportRate(treatment.notSuitable, total),
    },
    {
      label: 'Not applicable (no addiction risk)',
      value: formatCount(treatment.notApplicable),
      rate: formatSupportRate(treatment.notApplicable, total),
    },
    {
      label: 'Confirmed unsheltered neighbours',
      value: formatCount(unsheltered),
      rate: formatSupportRate(unsheltered, total),
    },
    {
      label: 'Unsheltered without addiction severity flag',
      value: formatCount(withoutSevereAddiction),
      rate: shareOfUnsheltered(withoutSevereAddiction),
    },
    {
      label: 'Addiction severity flagged',
      value: formatCount(summary.addiction_positive_count),
      rate: shareOfUnsheltered(summary.addiction_positive_count),
    },
    {
      label: 'Mental health severity flagged',
      value: formatCount(summary.mental_health_positive_count),
      rate: shareOfUnsheltered(summary.mental_health_positive_count),
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
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
              <dt className="text-xs uppercase tracking-wide text-on-surface-variant">{card.label}</dt>
              <dd className="mt-2 text-lg font-semibold text-on-surface">
                {card.value}
                {card.rate ? <span className="ml-2 text-xs font-normal text-on-surface-variant">{card.rate}</span> : null}
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
            description="Shows how many neighbours said yes, no, were not suitable, or did not require treatment during this count."
            data={treatmentChart}
          />
          <BreakdownChart
            title="Where we connected"
            description="Location types guide canopy routes, motel supports, and shelter co-ordination."
            data={locationChart}
          />
          <BreakdownChart
            title="Addiction severity"
            description="Flags indicate when outreach teams observe or neighbours share high addiction risks that require rapid follow-up."
            data={addictionChart}
          />
          <BreakdownChart
            title="Mental health severity"
            description="Flags show when neighbours share acute mental health concerns so outreach leads can coordinate timely check-ins."
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
