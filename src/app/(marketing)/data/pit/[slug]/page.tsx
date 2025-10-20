import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BreakdownChart } from '@/components/pit/breakdown-chart';
import { formatCount, formatPitDateRange, groupBreakdownsForCount, isPitCountInProgress, toChartData } from '@/lib/pit/public';
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

  const { summary, breakdowns, refreshedAt } = await getPitCountBySlug(slug);

  if (!summary) {
    notFound();
  }
  const breakdownGroups = groupBreakdownsForCount(breakdowns, summary.id);
  const chartFor = (dimension: string) => toChartData(breakdownGroups.find((group) => group.dimension === dimension)?.rows ?? []);

  const ageChart = chartFor('age_bracket');
  const genderChart = chartFor('gender');
  const locationChart = chartFor('location_type');
  const addictionChart = chartFor('addiction_severity');
  const mentalHealthChart = chartFor('mental_health_severity');
  const treatmentChart = chartFor('wants_treatment');

  const summaryCards = [
    {
      label: 'Actively living outside',
      value: formatCount(summary.homelessness_confirmed_count || 0),
    },
    {
      label: 'Identified substance use / addictions',
      value: formatCount(summary.addiction_positive_count),
    },
    {
      label: 'Severe mental health conditions',
      value: formatCount(summary.mental_health_positive_count),
    },
  ];
  const lastUpdated = formatLastUpdated(refreshedAt);

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
                'People volunteered anonymised responses while outreach teams offered supports across Cobourg outdoor routes. Totals exclude Transition House shelter residents and those couch surfing or temporarily staying with friends or family.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold ${
                isPitCountInProgress(summary)
                  ? 'bg-primary/10 text-primary'
                  : 'bg-outline/10 text-on-surface-variant'
              }`}
            >
              {isPitCountInProgress(summary) ? 'In Progress' : 'Completed'}
            </span>
            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-surface-container px-4 py-1 text-xs font-medium text-on-surface-variant">
              Updated {lastUpdated}
            </span>
          </div>
        </div>
        <p className="text-sm font-semibold text-error">
          In an emergency call 911. The Good Samaritan Drug Overdose Act protects the caller and the person experiencing an overdose.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Treatment interest snapshot</h2>
        <p className="text-sm text-on-surface-variant">
          Snapshot below highlights who outreach staff connected with during this count window. Visit the portal dashboard for deeper drill-downs.
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-outline/10 bg-surface-container-low p-4">
              <dt className="text-xs uppercase tracking-wide text-on-surface-variant">{card.label}</dt>
              <dd className="mt-2 text-lg font-semibold text-on-surface">{card.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Breakdowns</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <BreakdownChart
            title="Age distribution"
            description="Counts reflect people who consented to share their age bracket during the outreach window."
            data={ageChart}
          />
          <BreakdownChart
            title="Gender identity"
            description="People self-identify, and outreach teams only log what respondents are comfortable sharing."
            data={genderChart}
          />
          <BreakdownChart
            title="Wants treatment"
            description="Shows how many respondents said yes, no, were not suitable, or did not require treatment during this count."
            data={treatmentChart}
          />
          <BreakdownChart
            title="Where we connected"
            description="Location types guide canopy routes, motel supports, and shelter coordination."
            data={locationChart}
          />
          <BreakdownChart
            title="Addiction severity"
            description="Flags indicate when outreach teams observe or respondents share high addiction risks that require rapid follow-up."
            data={addictionChart}
          />
          <BreakdownChart
            title="Mental health severity"
            description="Flags show when respondents share acute mental health concerns so outreach leads can coordinate timely check-ins."
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
