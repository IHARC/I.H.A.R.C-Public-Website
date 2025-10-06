'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

interface PetitionPostSignActionsProps {
  petitionUrl: string;
}

export function PetitionPostSignActions({ petitionUrl }: PetitionPostSignActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    trackEvent('petition_share_clicked');
    const shareMessage = 'Join me in supporting IHARC\'s call for a State of Emergency to coordinate housing and overdose response.';

    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Support the declaration',
          text: shareMessage,
          url: petitionUrl,
        });
        setFeedback('Thanks for sharing the petition.');
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(petitionUrl);
      setFeedback('Link copied. Share it with neighbours.');
    } catch (error) {
      console.error('Failed to copy petition link', error);
      setFeedback('Copy this link to share: ' + petitionUrl);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-outline/20 bg-surface-container p-5">
      <h3 className="text-lg font-semibold text-on-surface">Start collaborating</h3>
      <p className="text-sm text-on-surface/70">
        Explore current plans, read the emergency brief, and invite neighbours to add their names.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          className="bg-primary text-on-primary hover:bg-primary/90"
          onClick={() => trackEvent('portal_open_after_petition')}
        >
          <Link href="/portal/ideas">Open Collaboration Portal</Link>
        </Button>
        <Button
          variant="outline"
          asChild
          onClick={() => trackEvent('emergency_brief_open_after_petition')}
        >
          <Link href="/emergency">Read the Emergency brief</Link>
        </Button>
        <Button type="button" variant="secondary" onClick={handleShare}>
          Share the petition
        </Button>
      </div>
      {feedback ? <p className="text-xs text-on-surface/60">{feedback}</p> : null}
    </div>
  );
}
