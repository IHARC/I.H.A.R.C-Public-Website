'use client';

import { useMemo, useState, useTransition } from 'react';
import { HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { copyDeck } from '@/lib/copy';
import { trackClientEvent } from '@/lib/telemetry';

const supportCopy = copyDeck.ideas.support;

export function UpvoteButton({
  ideaId,
  initialVotes,
  initialVoted,
}: {
  ideaId: string;
  initialVotes: number;
  initialVoted: boolean;
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(initialVoted);
  const [isPending, startTransition] = useTransition();

  const ariaLabel = useMemo(
    () => supportCopy.ariaLabel.replace('{{count}}', votes.toString()),
    [votes],
  );

  const handleClick = () => {
    trackClientEvent('idea_support_clicked', {
      ideaId,
      nextState: !voted,
    });

    startTransition(async () => {
      try {
        const res = await fetch(`/api/portal/ideas/${ideaId}/vote`, {
          method: 'POST',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Unable to update support');
        }
        const body = await res.json();
        setVotes(body.voteCount);
        setVoted(body.voted);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Support failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  const countStyles = voted
    ? 'bg-slate-200 text-slate-900 dark:bg-slate-200/90 dark:text-slate-900'
    : 'bg-white/20 text-white';

  return (
    <Button
      type="button"
      variant={voted ? 'secondary' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-live="polite"
      aria-label={ariaLabel}
      className="gap-2"
    >
      <HandHeart className="h-4 w-4" aria-hidden />
      <span className="font-semibold">
        {voted ? 'Supported' : supportCopy.ctaLabel}
      </span>
      <span
        className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none transition ${countStyles}`}
        aria-hidden
      >
        {votes}
      </span>
    </Button>
  );
}
