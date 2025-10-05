import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import type { Database } from '@/types/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlanUpdateComposer } from '@/components/portal/plan-update-composer';
import { PlanUpdateSupportButton } from '@/components/portal/plan-update-support-button';
import { PlanUpdateModeratorActions } from '@/components/portal/plan-update-moderation';
import { Button } from '@/components/ui/button';
import { LivedExperienceBadges } from '@/components/portal/lived-experience-badges';

export const dynamic = 'force-dynamic';

type PlanRow = Database['portal']['Tables']['plans']['Row'];
type FocusRow = Database['portal']['Tables']['plan_focus_areas']['Row'];
type KeyDateRow = Database['portal']['Tables']['plan_key_dates']['Row'];
type UpdateRow = Database['portal']['Tables']['plan_updates']['Row'];
type DecisionRow = Database['portal']['Tables']['plan_decision_notes']['Row'];

type PlanRecord = PlanRow & {
  focus_areas: FocusRow[];
  key_dates: KeyDateRow[];
  updates: (UpdateRow & {
    author: {
      id: string;
      display_name: string;
      position_title: string | null;
      affiliation_status: Database['portal']['Enums']['affiliation_status'];
      homelessness_experience: Database['portal']['Enums']['lived_experience_status'];
      substance_use_experience: Database['portal']['Enums']['lived_experience_status'];
    } | null;
  })[];
  decisions: (DecisionRow & {
    author: {
      id: string;
      display_name: string;
      position_title: string | null;
      affiliation_status: Database['portal']['Enums']['affiliation_status'];
      homelessness_experience: Database['portal']['Enums']['lived_experience_status'];
      substance_use_experience: Database['portal']['Enums']['lived_experience_status'];
    } | null;
  })[];
};

type PlanUpdateWithSupport = (UpdateRow & {
  author: {
    id: string;
    display_name: string;
    position_title: string | null;
    affiliation_status: Database['portal']['Enums']['affiliation_status'];
    homelessness_experience: Database['portal']['Enums']['lived_experience_status'];
    substance_use_experience: Database['portal']['Enums']['lived_experience_status'];
  } | null;
}) & {
  support_count: number;
  viewer_supported: boolean;
};

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await params;
  const slugParam = resolved.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) {
    notFound();
  }

  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerProfile = user ? await ensurePortalProfile(supabase, user.id) : null;
  const viewerRole = viewerProfile?.role ?? null;

  const { data: plan, error } = await portal
    .from('plans')
    .select(
      `*,
       focus_areas:plan_focus_areas(id, name, summary, created_at),
       key_dates:plan_key_dates(id, title, notes, scheduled_for, created_at),
       updates:plan_updates(id, problem, evidence, proposed_change, impact, risks, measurement, status, opened_at, decided_at, created_at, updated_at, author:author_profile_id(id, display_name, position_title, affiliation_status, homelessness_experience, substance_use_experience)),
       decisions:plan_decision_notes(id, decision, summary, created_at, author:author_profile_id(id, display_name, position_title, affiliation_status, homelessness_experience, substance_use_experience))`
    )
    .eq('slug', slug)
    .maybeSingle<PlanRecord>();

  if (error) {
    console.error('Unable to load plan', error);
  }

  if (!plan) {
    notFound();
  }

  const nextKeyDate = plan.key_dates
    .map((entry) => ({ ...entry, parsed: Date.parse(entry.scheduled_for) }))
    .filter((entry) => !Number.isNaN(entry.parsed))
    .sort((a, b) => a.parsed - b.parsed)[0] ?? null;

  const updateIds = plan.updates.map((update) => update.id);
  const supportCountMap = new Map<string, number>();
  const viewerSupportSet = new Set<string>();

  if (updateIds.length) {
    const { data: voteRows, error: voteError } = await portal
      .from('plan_update_votes')
      .select('plan_update_id, voter_profile_id')
      .in('plan_update_id', updateIds);

    if (voteError) {
      console.error('Failed to load plan update votes', voteError);
    }

    for (const vote of voteRows ?? []) {
      supportCountMap.set(vote.plan_update_id, (supportCountMap.get(vote.plan_update_id) ?? 0) + 1);
      if (viewerProfile && vote.voter_profile_id === viewerProfile.id) {
        viewerSupportSet.add(vote.plan_update_id);
      }
    }
  }

  const planUpdates: PlanUpdateWithSupport[] = plan.updates.map((update) => ({
    ...update,
    support_count: supportCountMap.get(update.id) ?? 0,
    viewer_supported: viewerProfile ? viewerSupportSet.has(update.id) : false,
  }));
  const openUpdateCount = planUpdates.filter((update) => update.status === 'open').length;

  return (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Working Plan</p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{plan.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Promoted on {formatDate(plan.promoted_at ?? plan.created_at)} · Next key date{' '}
                {nextKeyDate ? formatDate(nextKeyDate.scheduled_for) : 'to be scheduled'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand/70 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300"
                    aria-label="What this page is for"
                  >
                    <Info className="h-4 w-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left">
                  What this page is for: keep track of focus areas, proposed updates, decisions, and key dates. Everyone can read it; sign in to contribute.
                </TooltipContent>
              </Tooltip>
              <Link
                href="#updates"
                className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Review open updates{openUpdateCount ? ` (${openUpdateCount})` : ''}
              </Link>
            </div>
          </div>
          <p className="text-base text-slate-700 dark:text-slate-300">{plan.canonical_summary}</p>
        </header>

        <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-full px-4 py-2 data-[state=active]:bg-brand data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="updates" className="rounded-full px-4 py-2 data-[state=active]:bg-brand data-[state=active]:text-white">
              Updates
            </TabsTrigger>
            <TabsTrigger value="decisions" className="rounded-full px-4 py-2 data-[state=active]:bg-brand data-[state=active]:text-white">
              Decisions
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-full px-4 py-2 data-[state=active]:bg-brand data-[state=active]:text-white">
              Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300">This is the current draft plan in plain language.</p>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Focus areas</h2>
            {plan.focus_areas.length ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {plan.focus_areas.map((focus) => (
                  <li key={focus.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{focus.name}</h3>
                    {focus.summary ? <p className="mt-2 text-sm leading-relaxed">{focus.summary}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Focus areas will be added as collaborators shape the plan.</p>
            )}
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Key dates</h2>
            {plan.key_dates.length ? (
              <ul className="space-y-3">
                {plan.key_dates
                  .sort((a, b) => Date.parse(a.scheduled_for) - Date.parse(b.scheduled_for))
                  .map((date) => (
                    <li key={date.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{date.title}</p>
                      <p className="text-xs uppercase tracking-wide text-brand">{formatDate(date.scheduled_for)}</p>
                      {date.notes ? <p className="mt-1 text-slate-600 dark:text-slate-300">{date.notes}</p> : null}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Key dates will appear once moderators set milestones with the team.</p>
            )}
          </section>
        </TabsContent>

        <TabsContent id="updates" value="updates" className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300">Proposed changes to this plan. Add your input.</p>
          <div className="flex flex-wrap items-center gap-3">
            {viewerProfile ? (
              <PlanUpdateComposer planId={plan.id} />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex" aria-disabled="true">
                    <Button variant="outline" disabled>
                      Propose a plan update
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Sign in to take part.</TooltipContent>
              </Tooltip>
            )}
          </div>
          {planUpdates.length ? (
            <ul className="space-y-4">
              {planUpdates
                .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                .map((update) => (
                  <li key={update.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-muted">
                      <span>Status: {update.status.replace(/_/g, ' ')}</span>
                      <span>Opened {formatDate(update.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{update.proposed_change}</h3>
                      {viewerProfile ? (
                        <PlanUpdateSupportButton
                          updateId={update.id}
                          initialSupported={update.viewer_supported}
                          initialSupportCount={update.support_count}
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex" aria-disabled="true">
                              <Button size="sm" variant="outline" disabled>
                                <span className="mr-2">Support update</span>
                                <span className="font-semibold">{update.support_count}</span>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Sign in to take part.</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <UpdateSection label="Problem" value={update.problem} />
                    <UpdateSection label="Evidence" value={update.evidence} />
                    <UpdateSection label="Impact" value={update.impact} />
                    <UpdateSection label="Risks" value={update.risks} />
                    <UpdateSection label="How we’ll measure success" value={update.measurement} />
                    {update.author ? (
                      <div className="text-xs text-muted">
                        <p>
                          Submitted by {update.author.display_name}
                          {update.author.affiliation_status === 'approved' && update.author.position_title
                            ? ` · ${update.author.position_title}`
                            : ''}
                        </p>
                        <LivedExperienceBadges
                          homelessness={update.author.homelessness_experience ?? null}
                          substanceUse={update.author.substance_use_experience ?? null}
                        />
                      </div>
                    ) : null}
                    {viewerRole === 'moderator' || viewerRole === 'admin' ? (
                      <PlanUpdateModeratorActions
                        updateId={update.id}
                        currentStatus={update.status}
                        planSummary={plan.canonical_summary}
                      />
                    ) : null}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No plan updates yet. Add one to suggest a change.</p>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300">What we decided and why.</p>
          {plan.decisions.length ? (
            <ul className="space-y-3">
              {plan.decisions
                .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                .map((decision) => (
                  <li key={decision.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-muted">
                      <span>{decision.decision.replace(/_/g, ' ')}</span>
                      <span>{formatDate(decision.created_at)}</span>
                    </div>
                    <p className="mt-2 text-slate-700 dark:text-slate-200">{decision.summary}</p>
                    {decision.author ? (
                      <div className="mt-2 text-xs text-muted">
                        <p>
                          Posted by {decision.author.display_name}
                          {decision.author.affiliation_status === 'approved' && decision.author.position_title
                            ? ` · ${decision.author.position_title}`
                            : ''}
                        </p>
                        <LivedExperienceBadges
                          homelessness={decision.author.homelessness_experience ?? null}
                          substanceUse={decision.author.substance_use_experience ?? null}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Decision notes will appear here after moderators accept or decline updates.</p>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300">Key dates and actions in order.</p>
          <ol className="space-y-3">
            <li className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="font-semibold text-slate-900 dark:text-slate-50">Plan promoted</p>
              <p className="text-xs uppercase tracking-wide text-brand">{formatDate(plan.promoted_at ?? plan.created_at)}</p>
            </li>
            {plan.key_dates
              .sort((a, b) => Date.parse(a.scheduled_for) - Date.parse(b.scheduled_for))
              .map((date) => (
                <li key={date.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{date.title}</p>
                  <p className="text-xs uppercase tracking-wide text-brand">{formatDate(date.scheduled_for)}</p>
                  {date.notes ? <p className="mt-1 text-slate-600 dark:text-slate-300">{date.notes}</p> : null}
                </li>
              ))}
            {planUpdates
              .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
              .map((update) => (
                <li key={update.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Plan update · {update.proposed_change}</p>
                  <p className="text-xs uppercase tracking-wide text-brand">{formatDate(update.created_at)}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">Status: {update.status.replace(/_/g, ' ')}</p>
                </li>
              ))}
            {plan.decisions
              .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
              .map((decision) => (
                <li key={decision.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Decision note · {decision.decision.replace(/_/g, ' ')}</p>
                  <p className="text-xs uppercase tracking-wide text-brand">{formatDate(decision.created_at)}</p>
                </li>
              ))}
          </ol>
        </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function UpdateSection({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
