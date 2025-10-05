'use client';

import { Badge } from '@/components/ui/badge';
import { LivedExperienceBadges } from '@/components/portal/lived-experience-badges';
import type { LivedExperienceStatus } from '@/lib/lived-experience';

export type CommentNode = {
  id: string;
  body: string;
  createdAt: string;
  isOfficial: boolean;
  commentType: 'question' | 'suggestion' | 'response' | 'official_note';
  author: {
    displayName: string;
    organizationName?: string | null;
    orgVerified?: boolean;
    positionTitle?: string | null;
    homelessnessExperience?: LivedExperienceStatus | null;
    substanceUseExperience?: LivedExperienceStatus | null;
  };
  evidenceUrl?: string | null;
};

const TYPE_LABEL: Record<CommentNode['commentType'], string> = {
  question: 'Question',
  suggestion: 'Suggestion',
  response: 'Official response',
  official_note: 'Moderator note',
};

export function CommentThread({ comments }: { comments: CommentNode[] }) {
  if (!comments.length) {
    return <p className="text-sm text-muted">No questions or suggestions yet.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          aria-label={`Comment from ${comment.author.displayName}`}
        >
          <header className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{comment.author.displayName}</span>
              {comment.author.positionTitle ? (
                <span className="text-xs text-muted">· {comment.author.positionTitle}</span>
              ) : null}
              <LivedExperienceBadges
                homelessness={comment.author.homelessnessExperience ?? null}
                substanceUse={comment.author.substanceUseExperience ?? null}
              />
              <Badge variant={comment.isOfficial ? 'default' : 'secondary'} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {TYPE_LABEL[comment.commentType]}
              </Badge>
            </div>
            <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('en-CA')}</time>
          </header>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{comment.body}</p>
          {comment.evidenceUrl ? (
            <p className="mt-2 text-xs text-muted">
              Evidence:{' '}
              <a
                href={comment.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline"
              >
                Open attached link
              </a>
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
