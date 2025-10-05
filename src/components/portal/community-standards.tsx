'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { copyDeck } from '@/lib/copy';

const { communityStandards } = copyDeck;

type CommunityStandardsCalloutProps = {
  onAcknowledge: () => Promise<void> | void;
  acknowledged: boolean;
};

export function CommunityStandardsCallout({ onAcknowledge, acknowledged }: CommunityStandardsCalloutProps) {
  const [pending, setPending] = useState(false);

  if (acknowledged) {
    return null;
  }

  const handleAcknowledge = async () => {
    setPending(true);
    try {
      await onAcknowledge();
    } finally {
      setPending(false);
    }
  };

  return (
    <Alert className="mb-6 space-y-4 border-brand/40 bg-brand/5">
      <div>
        <AlertTitle className="text-base font-semibold text-brand">
          {communityStandards.title}
        </AlertTitle>
        <AlertDescription className="mt-1 text-sm text-slate-700 dark:text-slate-200">
          {communityStandards.stance}
        </AlertDescription>
      </div>
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <p>{communityStandards.reminder}</p>
        <ul className="list-disc space-y-2 pl-5">
          {communityStandards.values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      </div>
      <Button onClick={handleAcknowledge} disabled={pending} className="w-full sm:w-auto">
        I agree to these standards
      </Button>
    </Alert>
  );
}
