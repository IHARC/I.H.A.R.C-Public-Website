import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { IdeaCard } from '@/components/portal/idea-card';
import { UpvoteButton } from '@/components/portal/upvote-button';
import { InteractiveCommentThread } from '@/components/portal/interactive-comment-thread';
import { CommentComposer } from '@/components/portal/comment-composer';
import { CommentNode } from '@/components/portal/comment-thread';
import { EmptyState } from '@/components/portal/empty-state';
import { Button } from '@/components/ui/button';

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseRSCClient();
  const service = createSupabaseServiceClient();

  const { data: idea, error } = await supabase
    .from('portal.ideas')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (!idea) {
    notFound();
  }

  const { data: authorProfile } = await supabase
    .from('portal.profiles')
    .select('id, display_name, organization_id')
    .eq('id', idea.author_profile_id)
    .maybeSingle();

  const organizationId = authorProfile?.organization_id;
  const { data: organization } = organizationId
    ? await supabase
        .from('portal.organizations')
        .select('id, name, verified')
        .eq('id', organizationId)
        .maybeSingle()
    : { data: null };

  const attachments = await resolveAttachments(service, idea.attachments ?? []);

  const { data: comments } = await supabase
    .from('portal.comments')
    .select('*')
    .eq('idea_id', idea.id)
    .order('created_at', { ascending: true });

  const commentProfilesIds = Array.from(new Set((comments ?? []).map((comment) => comment.author_profile_id)));
  const { data: commentProfiles } = await supabase
    .from('portal.profiles')
    .select('id, display_name, organization_id')
    .in('id', commentProfilesIds.length ? commentProfilesIds : ['00000000-0000-0000-0000-000000000000']);

  const commentOrgIds = Array.from(
    new Set((commentProfiles ?? []).map((profile) => profile.organization_id).filter(Boolean)),
  ) as string[];

  const { data: commentOrganizations } = await supabase
    .from('portal.organizations')
    .select('id, name, verified')
    .in('id', commentOrgIds.length ? commentOrgIds : ['00000000-0000-0000-0000-000000000000']);

  const profileMap = new Map((commentProfiles ?? []).map((profile) => [profile.id, profile]));
  const organizationMap = new Map((commentOrganizations ?? []).map((org) => [org.id, org]));

  const commentTree = buildCommentTree(comments ?? [], profileMap, organizationMap);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let voterProfileId: string | null = null;
  let userProfile = null;
  if (user) {
    userProfile = await ensurePortalProfile(user.id);
    voterProfileId = userProfile.id;
  }

  const { data: voteRow } = voterProfileId
    ? await supabase
        .from('portal.votes')
        .select('idea_id')
        .eq('idea_id', idea.id)
        .eq('voter_profile_id', voterProfileId)
        .maybeSingle()
    : { data: null };

  const summaryIdea = {
    id: idea.id,
    title: idea.title,
    body: idea.body,
    category: idea.category,
    status: idea.status,
    tags: idea.tags ?? [],
    voteCount: idea.vote_count ?? 0,
    commentCount: idea.comment_count ?? 0,
    lastActivityAt: idea.last_activity_at,
    createdAt: idea.created_at,
    isAnonymous: idea.is_anonymous,
    authorDisplayName: authorProfile?.display_name ?? 'Community Member',
    organizationName: organization?.name ?? null,
    orgVerified: organization?.verified ?? false,
    officialCount: comments?.filter((comment) => comment.is_official).length ?? 0,
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <IdeaCard
        idea={summaryIdea}
        actions={
          voterProfileId ? (
            <UpvoteButton ideaId={idea.id} initialVotes={summaryIdea.voteCount} initialVoted={Boolean(voteRow)} />
          ) : null
        }
      />

      {attachments.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Attachments</h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Discussion</h2>
          {user ? null : <Link href="/login" className="text-sm text-brand hover:underline">Sign in to participate</Link>}
        </div>
        {user ? <CommentComposer ideaId={idea.id} /> : null}
        {commentTree.length ? (
          <InteractiveCommentThread ideaId={idea.id} comments={commentTree} canReply={Boolean(user)} />
        ) : (
          <EmptyState title="No comments yet" description="Start the conversation with your perspective." />
        )}
      </section>
    </div>
  );
}

async function resolveAttachments(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  attachments: Array<{ path: string; name?: string; content_type?: string; size?: number }> | null,
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

function buildCommentTree(
  comments: Array<{
    id: string;
    idea_id: string;
    author_profile_id: string;
    parent_comment_id: string | null;
    body: string;
    is_official: boolean;
    depth: number;
    created_at: string;
  }>,
  profileMap: Map<string, { id: string; display_name: string; organization_id: string | null }>,
  organizationMap: Map<string, { id: string; name: string; verified: boolean }>,
): CommentNode[] {
  const nodes = comments.map<CommentNode>((comment) => {
    const profile = profileMap.get(comment.author_profile_id);
    const organization = profile?.organization_id ? organizationMap.get(profile.organization_id) : null;
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      isOfficial: comment.is_official,
      depth: comment.depth,
      author: {
        displayName: profile?.display_name ?? 'Community Member',
        organizationName: organization?.name ?? null,
        orgVerified: organization?.verified ?? false,
      },
      children: [],
    };
  });

  const nodeMap = new Map<string, CommentNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));
  const roots: CommentNode[] = [];

  comments.forEach((comment) => {
    const node = nodeMap.get(comment.id)!;
    if (comment.parent_comment_id && nodeMap.has(comment.parent_comment_id)) {
      nodeMap.get(comment.parent_comment_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
