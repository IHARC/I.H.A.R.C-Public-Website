'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OrgBadge } from '@/components/portal/org-badge';
import { scanContentForSafety } from '@/lib/safety';
import { toast } from '@/components/ui/use-toast';

export type CommentNode = {
  id: string;
  body: string;
  createdAt: string;
  isOfficial: boolean;
  depth: number;
  author: {
    displayName: string;
    organizationName?: string | null;
    orgVerified?: boolean;
  };
  children?: CommentNode[];
};

export function CommentThread({
  comments,
  ideaId,
  onSubmit,
  canReply,
}: {
  comments: CommentNode[];
  ideaId: string;
  onSubmit: (payload: { body: string; parentId?: string }) => Promise<void>;
  canReply: boolean;
}) {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} ideaId={ideaId} onSubmit={onSubmit} canReply={canReply} />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  ideaId,
  onSubmit,
  canReply,
}: {
  comment: CommentNode;
  ideaId: string;
  onSubmit: (payload: { body: string; parentId?: string }) => Promise<void>;
  canReply: boolean;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="space-y-3">
      <article
        className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
        aria-label={`Comment from ${comment.author.displayName}`}
      >
        <header className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{comment.author.displayName}</span>
            {comment.isOfficial && comment.author.organizationName && (
              <OrgBadge name={comment.author.organizationName} verified={comment.author.orgVerified} />
            )}
          </div>
          <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('en-CA')}</time>
        </header>
        <p className="mt-2 text-slate-700 dark:text-slate-200">{comment.body}</p>
        {canReply && comment.depth < 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
            onClick={() => setIsReplying((prev) => !prev)}
          >
            {isReplying ? 'Cancel reply' : 'Reply'}
          </Button>
        )}
        {isReplying && (
          <ReplyEditor
            onCancel={() => setIsReplying(false)}
            onSubmit={async (body) => {
              const safety = scanContentForSafety(body);
              if (safety.hasPii || safety.hasProfanity) {
                toast({
                  title: 'Please revise your reply',
                  description: 'Content appears to include restricted information.',
                  variant: 'destructive',
                });
                return;
              }

              await onSubmit({ body, parentId: comment.id });
              setIsReplying(false);
            }}
          />
        )}
      </article>
      {comment.children?.length ? (
        <div className="space-y-4 border-l border-slate-200 pl-6 dark:border-slate-800">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              ideaId={ideaId}
              onSubmit={onSubmit}
              canReply={canReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReplyEditor({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (body: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setPending(true);
    try {
      await onSubmit(value.trim());
      setValue('');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Share your perspective (no PII or personal accusations)."
      />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={pending || !value.trim()}>
          Post reply
        </Button>
      </div>
    </div>
  );
}
