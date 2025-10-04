'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export type AssignmentInfo = {
  id: string;
  displayName: string;
  organizationName?: string | null;
};

export function IdeaAssignmentCard({
  ideaId,
  assignee,
  viewerProfileId,
  viewerRole,
  viewerDisplayName,
}: {
  ideaId: string;
  assignee: AssignmentInfo | null;
  viewerProfileId: string | null;
  viewerRole: 'user' | 'org_rep' | 'moderator' | 'admin' | null;
  viewerDisplayName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const canAssign = viewerRole === 'moderator' || viewerRole === 'admin';
  const [localAssignee, setLocalAssignee] = useState<AssignmentInfo | null>(assignee);

  useEffect(() => {
    setLocalAssignee(assignee);
  }, [assignee]);

  const isSelfAssigned = Boolean(localAssignee && localAssignee.id === viewerProfileId);

  const assign = (target: 'self' | null) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/portal/ideas/${ideaId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignee_profile_id: target }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Assignment failed');
        }
        toast({
          title: target ? 'Assignment updated' : 'Assignment cleared',
          description: target ? 'You are now assigned to this idea.' : 'This idea is now unassigned.',
        });
        if (target === 'self' && viewerProfileId) {
          setLocalAssignee({
            id: viewerProfileId,
            displayName: viewerDisplayName ?? 'You',
          });
        } else if (!target) {
          setLocalAssignee(null);
        }
      } catch (error) {
        toast({
          title: 'Unable to update assignment',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Owner</h3>
        {localAssignee ? (
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
            {localAssignee.displayName}
            {localAssignee.organizationName ? ` · ${localAssignee.organizationName}` : ''}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No one is assigned yet.</p>
        )}
      </div>
      {canAssign && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => assign('self')}
            disabled={pending || isSelfAssigned}
            variant={isSelfAssigned ? 'secondary' : 'default'}
          >
            {isSelfAssigned ? 'Assigned to you' : 'Assign to me'}
          </Button>
          {localAssignee ? (
            <Button size="sm" variant="ghost" onClick={() => assign(null)} disabled={pending}>
              Clear
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
