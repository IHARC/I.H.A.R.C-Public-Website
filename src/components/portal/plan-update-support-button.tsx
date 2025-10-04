'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface PlanUpdateSupportButtonProps {
  updateId: string;
  initialSupported: boolean;
  initialSupportCount: number;
}

export function PlanUpdateSupportButton({
  updateId,
  initialSupported,
  initialSupportCount,
}: PlanUpdateSupportButtonProps) {
  const [supported, setSupported] = useState(initialSupported);
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/portal/plans/updates/${updateId}/vote`, { method: 'POST' });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to update support');
        }
        const payload = await response.json();
        setSupported(payload.voted);
        setSupportCount(payload.supportCount);
      } catch (error) {
        toast({
          title: 'Support update failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button
      variant={supported ? 'secondary' : 'outline'}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={supported}
    >
      <span className="mr-2">{supported ? 'Supported' : 'Support update'}</span>
      <span className="font-semibold">{supportCount}</span>
    </Button>
  );
}
