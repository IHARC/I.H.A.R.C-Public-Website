'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

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

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/portal/ideas/${ideaId}/vote`, {
          method: 'POST',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Unable to update vote');
        }
        const body = await res.json();
        setVotes(body.voteCount);
        setVoted(body.voted);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Vote failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button
      variant={voted ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-live="polite"
    >
      <span className="mr-2">{voted ? 'Upvoted' : 'Upvote'}</span>
      <span className="font-semibold">{votes}</span>
    </Button>
  );
}
