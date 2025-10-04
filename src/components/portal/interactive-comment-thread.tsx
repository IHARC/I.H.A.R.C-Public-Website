'use client';

import { CommentThread, type CommentNode } from '@/components/portal/comment-thread';

export function InteractiveCommentThread({ comments }: { ideaId: string; comments: CommentNode[]; canReply: boolean }) {
  return <CommentThread comments={comments} />;
}
