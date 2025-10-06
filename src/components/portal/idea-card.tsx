import Link from 'next/link';
import { Landmark, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/portal/status-badge';
import { TagChips } from '@/components/portal/tag-chips';
import { LivedExperienceBadges } from '@/components/portal/lived-experience-badges';
import type { LivedExperienceStatus } from '@/lib/lived-experience';
import { copyDeck } from '@/lib/copy';
import {
  countSupportReactions,
  REACTION_DEFINITIONS,
  type ReactionSummary,
} from '@/lib/reactions';

export type IdeaSummary = {
  id: string;
  title: string;
  body: string;
  problemStatement?: string | null;
  proposalSummary?: string | null;
  category: string;
  status: string;
  publicationStatus: 'draft' | 'published' | 'archived';
  tags: string[];
  reactions: ReactionSummary;
  commentCount: number;
  lastActivityAt: string;
  createdAt: string;
  isAnonymous: boolean;
  authorDisplayName: string;
  positionTitle?: string | null;
  organizationName?: string | null;
  orgVerified?: boolean;
  officialCount?: number;
  homelessnessExperience?: LivedExperienceStatus | null;
  substanceUseExperience?: LivedExperienceStatus | null;
};

export function IdeaCard({ idea, actions }: { idea: IdeaSummary; actions?: React.ReactNode }) {
  const displayName = idea.isAnonymous ? 'Anonymous' : idea.authorDisplayName;
  const preview = idea.proposalSummary || idea.problemStatement || idea.body;
  const draftBadge = copyDeck.ideas.quick.draftBadge;
  const supportCount = countSupportReactions(idea.reactions);
  const topReactions = REACTION_DEFINITIONS.map((definition) => ({
    definition,
    count: idea.reactions[definition.type] ?? 0,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            <Link href={`/solutions/${idea.id}`} className="focus-outline inline-flex items-center gap-2">
              {idea.title}
              <span className="text-xs font-medium uppercase tracking-wide text-muted-subtle">{idea.category}</span>
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2">
            {idea.publicationStatus === 'draft' ? (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
                {draftBadge}
              </Badge>
            ) : null}
            <StatusBadge status={idea.status} />
          </div>
        </div>
        <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{preview}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>By {displayName}</span>
          {idea.positionTitle ? <span>· {idea.positionTitle}</span> : null}
          {idea.organizationName && (
            <Badge variant="outline" className="border-brand/40 text-brand">
              {idea.organizationName}
            </Badge>
          )}
          <span aria-label="Last activity" className="ml-auto">
            Updated {new Date(idea.lastActivityAt).toLocaleDateString('en-CA')}
          </span>
        </div>
        <LivedExperienceBadges
          homelessness={idea.homelessnessExperience ?? null}
          substanceUse={idea.substanceUseExperience ?? null}
        />
        <TagChips tags={idea.tags} />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2" aria-label="Community reactions">
          {topReactions.length ? (
            topReactions.map(({ definition, count }) => (
              <span
                key={definition.type}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold leading-none text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <span aria-hidden>{definition.emoji}</span>
                <span>{count}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-muted">No reactions yet</span>
          )}
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-muted" aria-live="polite">
            Supporters {supportCount}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span aria-label="Comments" className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span className="font-medium">{idea.commentCount}</span>
          </span>
          {idea.officialCount ? (
            <span aria-label="Official responses" className="inline-flex items-center gap-1">
              <Landmark className="h-4 w-4" aria-hidden />
              <span className="font-medium">{idea.officialCount}</span>
            </span>
          ) : null}
        </div>
        {actions}
      </CardFooter>
    </Card>
  );
}
