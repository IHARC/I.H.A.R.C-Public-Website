'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CommentThread, type CommentNode } from '@/components/portal/comment-thread';
import { toast } from '@/components/ui/use-toast';

export function InteractiveCommentThread({
  ideaId,
  comments,
  canReply,
}: {
  ideaId: string;
  comments: CommentNode[];
  canReply: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = async ({ body, parentId }: { body: string; parentId?: string }) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/portal/ideas/${ideaId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body, parent_id: parentId, is_official: false }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to post comment');
        }
        router.refresh();
      } catch (error) {
        toast({
          title: 'Comment failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return <CommentThread comments={comments} ideaId={ideaId} onSubmit={handleSubmit} canReply={canReply && !pending} />;
}
