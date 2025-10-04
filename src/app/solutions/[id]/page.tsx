import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ensurePortalProfile } from '@/lib/profile';
import { UpvoteButton } from '@/components/portal/upvote-button';
import { CommentComposer } from '@/components/portal/comment-composer';
import { CommentThread, type CommentNode } from '@/components/portal/comment-thread';
import { IdeaTimeline, type IdeaTimelineEvent } from '@/components/portal/idea-timeline';
import { IdeaAssignmentCard, type AssignmentInfo } from '@/components/portal/assignment-card';
import { RequestRevisionCard } from '@/components/portal/request-revision-card';
import { EmptyState } from '@/components/portal/empty-state';
import { StatusBadge } from '@/components/portal/status-badge';
import { TagChips } from '@/components/portal/tag-chips';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/supabase';

interface IdeaRecord extends Database['portal']['Tables']['ideas']['Row'] {
  author: {
    id: string;
    display_name: string;
    organization: { name: string; verified: boolean } | null;
  } | null;
  assignee: {
    id: string;
    display_name: string;
    organization: { name: string; verified: boolean } | null;
  } | null;
}

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  comment_type: Database['portal']['Enums']['comment_type'];
  is_official: boolean;
  author: {
    id: string;
    display_name: string;
    organization: { name: string; verified: boolean } | null;
  } | null;
};

type DecisionRow = {
  id: string;
  summary: string;
  visibility: string;
  created_at: string;
  author: {
    id: string;
    display_name: string;
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

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseRSCClient();
  const service = createSupabaseServiceClient();

  const { data: idea, error: ideaError } = await service
    .from('portal.ideas')
    .select(
      `*,
      author:author_profile_id(
        id,
        display_name,
        organization:organization_id(name, verified)
      ),
      assignee:assignee_profile_id(
        id,
        display_name,
        organization:organization_id(name, verified)
      )`
    )
    .eq('id', params.id)
    .maybeSingle<IdeaRecord>();

  if (ideaError) {
    console.error('Failed to load idea', ideaError);
  }

  if (!idea) {
    notFound();
  }

  const attachments = await resolveAttachments(service, (idea.attachments as Array<{ path: string; name?: string }>) ?? []);

  const { data: commentRows } = await service
    .from('portal.comments')
    .select(
      `id, body, created_at, comment_type, is_official,
       author:author_profile_id(id, display_name, organization:organization_id(name, verified))`
    )
    .eq('idea_id', idea.id)
    .order('created_at', { ascending: true })
    .returns<CommentRow[]>();

  const { data: decisionsData } = await service
    .from('portal.idea_decisions')
    .select(
      `id, summary, visibility, created_at,
       author:author_profile_id(id, display_name, organization:organization_id(name, verified))`
    )
    .eq('idea_id', idea.id)
    .order('created_at', { ascending: true })
    .returns<DecisionRow[]>();

  const { data: auditEntries } = await service
    .from('portal.audit_log')
    .select(
      `id, action, meta, created_at,
       actor:actor_profile_id(id, display_name, organization:organization_id(name, verified))`
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
    viewerProfile = await ensurePortalProfile(user.id);
    voterProfileId = viewerProfile.id;
  }

  let hasVoted = false;
  if (voterProfileId) {
    const { data: voteRow } = await supabase
      .from('portal.votes')
      .select('idea_id')
      .eq('idea_id', idea.id)
      .eq('voter_profile_id', voterProfileId)
      .maybeSingle();
    hasVoted = Boolean(voteRow);
  }

  const officialResponses = (commentRows ?? []).filter((comment) => comment.is_official);
  const communityComments: CommentNode[] = (commentRows ?? [])
    .filter((comment) => !comment.is_official)
    .map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      isOfficial: comment.is_official,
      commentType: comment.comment_type,
      author: {
        displayName: comment.author?.display_name ?? 'Community member',
        organizationName: comment.author?.organization?.name ?? null,
        orgVerified: comment.author?.organization?.verified ?? false,
      },
    }));

  const timelineEvents = buildTimeline({
    idea,
    officialResponses,
    decisions: decisionsData ?? [],
    audits: auditEntries ?? [],
    viewerProfile,
  });

  const assignment: AssignmentInfo | null = idea.assignee
    ? {
        id: idea.assignee.id,
        displayName: idea.assignee.display_name,
        organizationName: idea.assignee.organization?.name ?? null,
      }
    : null;

  const viewerRole = viewerProfile?.role ?? null;

  const displayAuthor = idea.is_anonymous
    ? 'Anonymous'
    : idea.author?.display_name ?? 'Community member';
  const lastActivity = idea.last_activity_at ?? idea.created_at;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div className="space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <StatusBadge status={idea.status} />
                <span className="uppercase tracking-wide">{idea.category}</span>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{idea.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>By {displayAuthor}</span>
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
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign in to vote</Link>
              </Button>
            )}
          </div>
        </header>

        <section className="space-y-4">
          {SECTION_CONFIG.map((section) => {
            const content = (idea as Record<string, unknown>)[section.key];
            if (!content) return null;
            return (
              <article
                key={section.key}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{String(content)}</p>
              </article>
            );
          })}
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
            {user ? null : <Link href="/login" className="text-sm text-brand hover:underline">Sign in to participate</Link>}
          </div>
          {user ? <CommentComposer ideaId={idea.id} /> : null}
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
        />

        {viewerRole === 'moderator' || viewerRole === 'admin' ? <RequestRevisionCard ideaId={idea.id} /> : null}

        {officialResponses.length ? (
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Official responses</h2>
            <CommentThread
              comments={officialResponses.map((comment) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.created_at,
                isOfficial: true,
                commentType: comment.comment_type,
                author: {
                  displayName: comment.author?.display_name ?? 'Official response',
                  organizationName: comment.author?.organization?.name ?? null,
                  orgVerified: comment.author?.organization?.verified ?? false,
                },
              }))}
            />
          </section>
        ) : null}

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Timeline</h2>
          <IdeaTimeline events={timelineEvents} />
        </section>
      </aside>
    </div>
  );
}

async function resolveAttachments(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  attachments: Array<{ path: string; name?: string }> | null,
) {
  if (!attachments?.length) return [] as Array<{ path: string; signedUrl: string; name: string }>;

  const results = await Promise.all(
    attachments.map(async (attachment) => {
      const { data, error } = await supabase.storage
        .from('portal-attachments')
        .createSignedUrl(attachment.path, 120);
      if (error || !data) return null;
      return {
        path: attachment.path,
        name: attachment.name ?? attachment.path.split('/').pop() ?? 'Attachment',
        signedUrl: data.signedUrl,
      };
    }),
  );

  return results.filter(Boolean) as Array<{ path: string; signedUrl: string; name: string }>;
}

type TimelineBuilderArgs = {
  idea: IdeaRecord;
  officialResponses: CommentRow[];
  decisions: DecisionRow[];
  audits: AuditRow[];
  viewerProfile: Awaited<ReturnType<typeof ensurePortalProfile>> | null;
};

function buildTimeline({ idea, officialResponses, decisions, audits, viewerProfile }: TimelineBuilderArgs) {
  const events: IdeaTimelineEvent[] = [];

  events.push({
    id: `${idea.id}-created`,
    timestamp: idea.created_at,
    type: 'created',
    title: 'Idea submitted',
    actor: idea.is_anonymous
      ? null
      : {
          displayName: idea.author?.display_name ?? 'Community member',
          organizationName: idea.author?.organization?.name ?? undefined,
        },
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
        actor: entry.actor?.display_name
          ? {
              displayName: entry.actor.display_name,
              organizationName: entry.actor.organization?.name ?? undefined,
            }
          : null,
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
        actor: entry.actor?.display_name
          ? {
              displayName: entry.actor.display_name,
              organizationName: entry.actor.organization?.name ?? undefined,
            }
          : null,
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
        actor: decision.author?.display_name
          ? {
              displayName: decision.author.display_name,
              organizationName: decision.author.organization?.name ?? undefined,
            }
          : null,
      });
    });

  officialResponses.forEach((comment) => {
    events.push({
      id: `official-${comment.id}`,
      timestamp: comment.created_at,
      type: 'official_response',
      title: 'Official response recorded',
      description: comment.body,
      actor: comment.author?.display_name
        ? {
            displayName: comment.author.display_name,
            organizationName: comment.author.organization?.name ?? undefined,
          }
        : null,
    });
  });

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
