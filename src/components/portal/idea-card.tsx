import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/portal/status-badge';
import { TagChips } from '@/components/portal/tag-chips';

export type IdeaSummary = {
  id: string;
  title: string;
  body: string;
  problemStatement?: string | null;
  proposalSummary?: string | null;
  category: string;
  status: string;
  tags: string[];
  voteCount: number;
  commentCount: number;
  lastActivityAt: string;
  createdAt: string;
  isAnonymous: boolean;
  authorDisplayName: string;
  organizationName?: string | null;
  orgVerified?: boolean;
  officialCount?: number;
};

export function IdeaCard({ idea, actions }: { idea: IdeaSummary; actions?: React.ReactNode }) {
  const displayName = idea.isAnonymous ? 'Anonymous' : idea.authorDisplayName;
  const preview = idea.proposalSummary || idea.problemStatement || idea.body;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            <Link href={`/solutions/${idea.id}`} className="focus-outline inline-flex items-center gap-2">
              {idea.title}
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{idea.category}</span>
            </Link>
          </CardTitle>
          <StatusBadge status={idea.status} />
        </div>
        <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{preview}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>By {displayName}</span>
          {idea.organizationName && (
            <Badge variant="outline" className="border-brand/40 text-brand">
              {idea.organizationName}
            </Badge>
          )}
          <span aria-label="Last activity" className="ml-auto">
            Updated {new Date(idea.lastActivityAt).toLocaleDateString('en-CA')}
          </span>
        </div>
        <TagChips tags={idea.tags} />
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span aria-label="Upvotes">👍 {idea.voteCount}</span>
          <span aria-label="Comments">💬 {idea.commentCount}</span>
          {idea.officialCount ? <span aria-label="Official responses">🏛️ {idea.officialCount}</span> : null}
        </div>
        {actions}
      </CardFooter>
    </Card>
  );
}
