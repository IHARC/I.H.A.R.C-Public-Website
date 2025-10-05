import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HandHeart } from 'lucide-react';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { copyDeck } from '@/lib/copy';
import { UpvoteButton } from '@/components/portal/upvote-button';
import { CommentComposer } from '@/components/portal/comment-composer';
import { CommentThread, type CommentNode } from '@/components/portal/comment-thread';
import { IdeaTimeline, type IdeaTimelineEvent } from '@/components/portal/idea-timeline';
import { IdeaAssignmentCard, type AssignmentInfo } from '@/components/portal/assignment-card';
import { RequestRevisionCard } from '@/components/portal/request-revision-card';
import { EmptyState } from '@/components/portal/empty-state';
import { StatusBadge } from '@/components/portal/status-badge';
import { TagChips } from '@/components/portal/tag-chips';
import { IdeaMetricsList, type IdeaMetricDisplay } from '@/components/portal/idea-metrics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DEFAULT_FOCUS_AREAS, PLAN_SUPPORT_THRESHOLD } from '@/lib/plans';
import type { Database } from '@/types/supabase';
import { PromoteIdeaCard } from '@/components/portal/promote-idea-card';

type IdeaRow = Database['portal']['Tables']['ideas']['Row'];

interface IdeaRecord extends IdeaRow {
  author: {
    id: string;
    display_name: string;
    position_title: string | null;
    affiliation_status: Database['portal']['Enums']['affiliation_status'];
    organization: { name: string; verified: boolean } | null;
  } | null;
  assignee: {
    id: string;
    display_name: string;
    position_title: string | null;
    affiliation_status: Database['portal']['Enums']['affiliation_status'];
    organization: { name: string; verified: boolean } | null;
  } | null;
}

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  comment_type: Database['portal']['Enums']['comment_type'];
  is_official: boolean;
  evidence_url: string | null;
  author: {
    id: string;
    display_name: string;
    position_title: string | null;
    affiliation_status: Database['portal']['Enums']['affiliation_status'];
    organization: { name: string; verified: boolean } | null;
  } | null;
};

type MetricRow = {
  id: string;
  metric_label: string;
  success_definition: string | null;
  baseline: string | null;
  target: string | null;
  created_at: string;
};

type DecisionRow = {
  id: string;
  summary: string;
  visibility: string;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    position_title: string | null;
    affiliation_status: Database['portal']['Enums']['affiliation_status'];
    organization: { name: string; verified: boolean } | null;
  } | null;
};

type AuditRow = {
  id: string;
  action: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor: {
    id: string | null;
    display_name: string | null;
    position_title: string | null;
    affiliation_status: Database['portal']['Enums']['affiliation_status'] | null;
    organization: { name: string; verified: boolean } | null;
  } | null;
};

const SECTION_CONFIG = [
  { key: 'problem_statement', title: 'Problem' },
  { key: 'evidence', title: 'Evidence' },
  { key: 'proposal_summary', title: 'Proposal' },
  { key: 'implementation_steps', title: 'Steps' },
  { key: 'risks', title: 'Risks & supports' },
  { key: 'success_metrics', title: 'Success metrics' },
] as const;

const supportCopy = copyDeck.ideas.support;
const quickCopy = copyDeck.ideas.quick;


export const dynamic = 'force-dynamic';

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const idParam = resolvedParams.id;
  const ideaId = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!ideaId) {
    notFound();
  }
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select(
      `*,
      author:author_profile_id(
        id,
        display_name,
        position_title,
        affiliation_status,
        organization:organization_id(name, verified)
      ),
      assignee:assignee_profile_id(
        id,
        display_name,
        position_title,
        affiliation_status,
        organization:organization_id(name, verified)
      )`
    )
    .eq('id', ideaId)
    .maybeSingle<IdeaRecord>();

  if (ideaError) {
    console.error('Failed to load idea', ideaError);
  }

  if (!idea) {
    notFound();
  }

  const attachments = await resolveAttachments(
    supabase,
    (idea.attachments as Array<{ path: string; name?: string }>) ?? [],
  );

  const { data: commentRows } = await portal
    .from('comments')
    .select(
      `id, body, created_at, comment_type, is_official, evidence_url,
       author:author_profile_id(id, display_name, position_title, affiliation_status, organization:organization_id(name, verified))`
    )
    .eq('idea_id', idea.id)
    .order('created_at', { ascending: true })
    .returns<CommentRow[]>();

  const { data: metricRows } = await portal
    .from('idea_metrics')
    .select('id, metric_label, success_definition, baseline, target, created_at')
    .eq('idea_id', idea.id)
    .order('created_at', { ascending: true })
    .returns<MetricRow[]>();

  const { data: decisionsData } = await portal
    .from('idea_decisions')
    .select(
      `id, summary, visibility, created_at,
       author:author_profile_id(id, display_name, position_title, affiliation_status, organization:organization_id(name, verified))`
    )
    .eq('idea_id', idea.id)
    .order('created_at', { ascending: true })
    .returns<DecisionRow[]>();

  const { data: auditEntries } = await portal
    .from('audit_log')
    .select(
      `id, action, meta, created_at,
       actor:actor_profile_id(id, display_name, position_title, affiliation_status, organization:organization_id(name, verified))`
    )
    .eq('entity_id', idea.id)
    .eq('entity_type', 'idea')
    .order('created_at', { ascending: true })
    .returns<AuditRow[]>();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerProfile: Awaited<ReturnType<typeof ensurePortalProfile>> | null = null;
  let voterProfileId: string | null = null;

  if (user) {
    viewerProfile = await ensurePortalProfile(supabase, user.id);
    voterProfileId = viewerProfile.id;
  }

  let viewerOrgName: string | null = null;
  let viewerOrgVerified = false;

  if (viewerProfile?.organization_id) {
    const { data: viewerOrg, error: viewerOrgError } = await portal
      .from('organizations')
      .select('name, verified')
      .eq('id', viewerProfile.organization_id)
      .maybeSingle();

    if (viewerOrgError) {
      console.error('Failed to load viewer organization', viewerOrgError);
    } else if (viewerOrg) {
      viewerOrgName = viewerOrg.name ?? null;
      viewerOrgVerified = Boolean(viewerOrg.verified);
    }
  }

  let hasVoted = false;
  if (voterProfileId) {
    const { data: voteRow } = await portal
      .from('votes')
      .select('idea_id')
      .eq('idea_id', idea.id)
      .eq('voter_profile_id', voterProfileId)
      .maybeSingle();
    hasVoted = Boolean(voteRow);
  }

  const metrics: IdeaMetricDisplay[] = (metricRows ?? []).map((metric: MetricRow) => ({
    id: metric.id,
    label: metric.metric_label,
    definition: metric.success_definition,
    baseline: metric.baseline,
    target: metric.target,
  }));

  const officialResponses = (commentRows ?? []).filter((comment: CommentRow) => comment.is_official);
  const communityComments: CommentNode[] = (commentRows ?? [])
    .filter((comment: CommentRow) => !comment.is_official)
    .map((comment: CommentRow) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      isOfficial: comment.is_official,
      commentType: comment.comment_type,
      evidenceUrl: comment.evidence_url ?? null,
      author: {
        displayName: comment.author?.display_name ?? 'Community member',
        organizationName: comment.author?.organization?.name ?? null,
        orgVerified: comment.author?.organization?.verified ?? false,
        positionTitle:
          comment.author?.affiliation_status === 'approved' && comment.author?.position_title
            ? comment.author.position_title
            : null,
      },
    }));

  const timelineEvents = buildTimeline({
    idea,
    officialResponses,
    decisions: decisionsData ?? [],
    audits: auditEntries ?? [],
    viewerProfile,
  });

  const assignmentPosition =
    idea.assignee?.affiliation_status === 'approved' && idea.assignee?.position_title
      ? idea.assignee.position_title
      : null;

  const assignment: AssignmentInfo | null = idea.assignee
    ? {
        id: idea.assignee.id,
        displayName: idea.assignee.display_name,
        organizationName: idea.assignee.organization?.name ?? null,
        positionTitle: assignmentPosition,
      }
    : null;

  const viewerRole = viewerProfile?.role ?? null;
  const canPostOfficial = Boolean(
    viewerRole &&
      (viewerRole === 'moderator' ||
        viewerRole === 'admin' ||
        (viewerRole === 'org_rep' && viewerOrgVerified)),
  );

  const infoComplete = Boolean(
    idea.problem_statement &&
      idea.evidence &&
      idea.proposal_summary &&
      idea.implementation_steps &&
      idea.success_metrics,
  );
  const hasVerifiedSponsor = Boolean(idea.assignee?.organization?.verified);
  const planSummarySeed = idea.proposal_summary || idea.problem_statement || idea.body || '';

  const isDraft = idea.publication_status === 'draft';
  const isAuthor = viewerProfile?.id === idea.author_profile_id;
  const canCompleteDraft = isDraft && Boolean(isAuthor);

  const displayAuthor = idea.is_anonymous
    ? 'Anonymous'
    : idea.author?.display_name ?? 'Community member';

  const authorPosition =
    !idea.is_anonymous && idea.author?.affiliation_status === 'approved' && idea.author?.position_title
      ? idea.author.position_title
      : null;
  const lastActivity = idea.last_activity_at ?? idea.created_at;

  return (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div className="space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                {isDraft ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-100">
                    {quickCopy.draftBadge}
                  </Badge>
                ) : null}
                <StatusBadge status={idea.status} />
                <span className="uppercase tracking-wide">{idea.category}</span>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{idea.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>By {displayAuthor}</span>
                {authorPosition ? <span>· {authorPosition}</span> : null}
                {idea.author?.organization?.name && !idea.is_anonymous ? (
                  <span>· {idea.author.organization.name}</span>
                ) : null}
                <span>
                  Submitted {new Date(idea.created_at).toLocaleDateString('en-CA')} · Last activity{' '}
                  {new Date(lastActivity).toLocaleDateString('en-CA')}
                </span>
              </div>
              <TagChips tags={idea.tags ?? []} />
            </div>
            {voterProfileId ? (
              <UpvoteButton ideaId={idea.id} initialVotes={idea.vote_count ?? 0} initialVoted={hasVoted} />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex" aria-disabled="true">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled
                      aria-label={supportCopy.ariaLabel.replace('{{count}}', (idea.vote_count ?? 0).toString())}
                      className="gap-2"
                    >
                      <HandHeart className="h-4 w-4" aria-hidden />
                      <span className="font-semibold">{supportCopy.ctaLabel}</span>
                      <span
                        className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold leading-none text-slate-600"
                        aria-hidden
                      >
                        {idea.vote_count ?? 0}
                      </span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{supportCopy.guestPrompt}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        {canCompleteDraft ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTitle>Finish your proposal</AlertTitle>
            <AlertDescription className="mt-2 space-y-3 text-sm">
              <p>{quickCopy.upgradePrompt}</p>
              <Button asChild size="sm" variant="outline" className="border-amber-400 text-amber-900 dark:border-amber-500 dark:text-amber-100">
                <Link href={`/ideas/${idea.id}/complete`}>Complete full proposal</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Canonical summary</h2>
            <Badge variant="secondary" className="uppercase tracking-wide">Locked</Badge>
          </div>
          <div className="mt-4 space-y-6">
            {SECTION_CONFIG.map((section) => {
              const key = section.key as keyof IdeaRecord;
              const content = idea[key];
              if (!content) return null;
              return (
                <div key={section.key} className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{section.title}</h3>
                  <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{String(content)}</p>
                </div>
              );
            })}
            {metrics.length ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Success metrics</h3>
                <IdeaMetricsList metrics={metrics} />
              </div>
            ) : null}
          </div>
        </section>

        {attachments.length ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Attachments</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {attachments.map((attachment) => (
                <li key={attachment.path} className="flex items-center justify-between rounded border border-slate-200 p-2 dark:border-slate-800">
                  <span>{attachment.name}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={attachment.signedUrl} target="_blank" rel="noopener noreferrer">
                      Download
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Questions & suggestions</h2>
          </div>
          {user ? (
            <CommentComposer
              ideaId={idea.id}
              viewerRole={viewerRole ?? 'user'}
              canPostOfficial={canPostOfficial}
              officialOrganizationName={viewerOrgName}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block" aria-disabled="true">
                  <Button variant="outline" className="w-full justify-center" disabled>
                    Add a question or suggestion
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Sign in to take part.</TooltipContent>
            </Tooltip>
          )}
          {communityComments.length ? (
            <CommentThread comments={communityComments} />
          ) : (
            <EmptyState
              title="No community input yet"
              description="Share a question or suggestion to move this idea forward."
            />
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <IdeaAssignmentCard
          ideaId={idea.id}
          assignee={assignment}
          viewerProfileId={viewerProfile?.id ?? null}
          viewerRole={viewerRole}
          viewerDisplayName={viewerProfile?.display_name ?? null}
          viewerPositionTitle={viewerProfile?.position_title ?? null}
        />

        {viewerRole === 'moderator' || viewerRole === 'admin' ? (
          <PromoteIdeaCard
            ideaId={idea.id}
            ideaTitle={idea.title}
            defaultSummary={planSummarySeed}
            voteCount={idea.vote_count ?? 0}
            supportThreshold={PLAN_SUPPORT_THRESHOLD}
            infoComplete={infoComplete}
            hasVerifiedSponsor={hasVerifiedSponsor}
            defaultFocusAreas={DEFAULT_FOCUS_AREAS}
            publicationStatus={idea.publication_status as 'draft' | 'published' | 'archived'}
          />
        ) : null}

        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">How to help</h2>
          <p className="text-sm text-muted">
            Ask a question • Suggest an improvement • Show your support (vote).
          </p>
        </section>

        {viewerRole === 'moderator' || viewerRole === 'admin' ? <RequestRevisionCard ideaId={idea.id} /> : null}

        {officialResponses.length ? (
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Official responses</h2>
            <p className="text-xs text-muted">
              Updates shared by verified partners and moderators are pinned here for easy reference.
            </p>
            <CommentThread
              comments={officialResponses.map((comment: CommentRow) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.created_at,
                isOfficial: true,
                commentType: comment.comment_type,
                evidenceUrl: comment.evidence_url ?? null,
                author: {
                  displayName: comment.author?.display_name ?? 'Official response',
                  organizationName: comment.author?.organization?.name ?? null,
                  orgVerified: comment.author?.organization?.verified ?? false,
                  positionTitle:
                    comment.author?.affiliation_status === 'approved' && comment.author?.position_title
                      ? comment.author.position_title
                      : null,
                },
              }))}
            />
          </section>
        ) : null}

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Timeline</h2>
          <IdeaTimeline events={timelineEvents} />
        </section>
      </aside>
      </div>
    </TooltipProvider>
  );
}

async function resolveAttachments(
  supabase: Awaited<ReturnType<typeof createSupabaseRSCClient>>,
  attachments: Array<{ path: string; name?: string }> | null,
) {
  if (!attachments?.length) {
    return [] as Array<{ path: string; signedUrl: string; name: string }>;
  }

  const requestPayload = attachments.map((attachment) => ({
    path: attachment.path,
    name: attachment.name ?? attachment.path.split('/').pop() ?? 'Attachment',
  }));

  const { data, error } = await supabase.functions.invoke('portal-attachments', {
    body: { attachments: requestPayload },
  });

  if (error) {
    console.error('Failed to fetch attachment URLs', error);
    return [];
  }

  const signedList = Array.isArray((data as { attachments?: unknown })?.attachments)
    ? ((data as { attachments: AttachmentResult[] }).attachments)
    : [];

  return signedList.filter((entry): entry is AttachmentResult => {
    return Boolean(entry?.path && entry?.signedUrl && entry?.name);
  });
}

type AttachmentResult = { path: string; signedUrl: string; name: string };

type TimelineBuilderArgs = {
  idea: IdeaRecord;
  officialResponses: CommentRow[];
  decisions: DecisionRow[];
  audits: AuditRow[];
  viewerProfile: Awaited<ReturnType<typeof ensurePortalProfile>> | null;
};

function buildTimeline({ idea, officialResponses, decisions, audits, viewerProfile }: TimelineBuilderArgs) {
  const actorFromProfile = (
    profile:
      | IdeaRecord['author']
      | IdeaRecord['assignee']
      | CommentRow['author']
      | DecisionRow['author']
      | AuditRow['actor']
      | null,
  ) => {
    if (!profile || !profile.display_name) {
      return null;
    }
    return {
      displayName: profile.display_name,
      organizationName: profile.organization?.name ?? undefined,
      positionTitle:
        profile.affiliation_status === 'approved' && profile.position_title ? profile.position_title : undefined,
    };
  };

  const events: IdeaTimelineEvent[] = [];

  events.push({
    id: `${idea.id}-created`,
    timestamp: idea.created_at,
    type: 'created',
    title: 'Idea submitted',
    actor: idea.is_anonymous ? null : actorFromProfile(idea.author),
    description: null,
  });

  audits
    .filter((entry) => entry.action.startsWith('idea_status_'))
    .forEach((entry) => {
      const status = entry.action.replace('idea_status_', '').replace(/_/g, ' ');
      const note = typeof entry.meta?.note === 'string' ? String(entry.meta?.note) : null;
      events.push({
        id: entry.id,
        timestamp: entry.created_at,
        type: 'status',
        title: `Status changed to ${status}`,
        status,
        description: note,
        actor: actorFromProfile(entry.actor),
      });
    });

  audits
    .filter((entry) => entry.action === 'idea_assigned')
    .forEach((entry) => {
      const meta = entry.meta ?? {};
      events.push({
        id: entry.id,
        timestamp: entry.created_at,
        type: 'assignment',
        title:
          typeof meta.assignee_display_name === 'string'
            ? `Assigned to ${meta.assignee_display_name}`
            : 'Assignment updated',
        description: null,
        actor: actorFromProfile(entry.actor),
      });
    });

  const canSeePrivate = viewerProfile && (viewerProfile.role === 'moderator' || viewerProfile.role === 'admin' || viewerProfile.id === idea.author_profile_id);

  decisions
    .filter((decision) => decision.visibility === 'public' || canSeePrivate)
    .forEach((decision) => {
      events.push({
        id: decision.id,
        timestamp: decision.created_at,
        type: decision.visibility === 'author' ? 'revision' : 'decision',
        title: decision.visibility === 'author' ? 'Revision requested' : 'Decision noted',
        description: decision.summary,
        actor: actorFromProfile(decision.author),
      });
    });

  officialResponses.forEach((comment) => {
    events.push({
      id: `official-${comment.id}`,
      timestamp: comment.created_at,
      type: 'official_response',
      title: 'Official response recorded',
      description: comment.body,
      actor: actorFromProfile(comment.author),
    });
  });

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
