'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { LivedExperienceBadges } from '@/components/portal/lived-experience-badges';
import type { LivedExperienceStatus } from '@/lib/lived-experience';

export type AssignmentInfo = {
  id: string;
  displayName: string;
  organizationName?: string | null;
  positionTitle?: string | null;
  homelessnessExperience?: LivedExperienceStatus | null;
  substanceUseExperience?: LivedExperienceStatus | null;
};

export function IdeaAssignmentCard({
  ideaId,
  assignee,
  viewerProfileId,
  viewerRole,
  viewerDisplayName,
  viewerPositionTitle,
  viewerHomelessnessExperience,
  viewerSubstanceUseExperience,
}: {
  ideaId: string;
  assignee: AssignmentInfo | null;
  viewerProfileId: string | null;
  viewerRole: 'user' | 'org_rep' | 'moderator' | 'admin' | null;
  viewerDisplayName: string | null;
  viewerPositionTitle: string | null;
  viewerHomelessnessExperience: LivedExperienceStatus | null;
  viewerSubstanceUseExperience: LivedExperienceStatus | null;
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
          throw new Error((payload as { error?: string }).error || 'Assignment failed');
        }
        toast({
          title: target ? 'Assignment updated' : 'Assignment cleared',
          description: target ? 'You are now assigned to this idea.' : 'This idea is now unassigned.',
        });
        if (target === 'self' && viewerProfileId) {
          setLocalAssignee({
            id: viewerProfileId,
            displayName: viewerDisplayName ?? 'You',
            positionTitle: viewerPositionTitle,
            homelessnessExperience: viewerHomelessnessExperience,
            substanceUseExperience: viewerSubstanceUseExperience,
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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Owner</h3>
        {localAssignee ? (
          <div className="mt-1 space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <p>
              {localAssignee.displayName}
              {localAssignee.organizationName ? ` · ${localAssignee.organizationName}` : ''}
              {localAssignee.positionTitle ? ` · ${localAssignee.positionTitle}` : ''}
            </p>
            <LivedExperienceBadges
              homelessness={localAssignee.homelessnessExperience ?? null}
              substanceUse={localAssignee.substanceUseExperience ?? null}
            />
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">No one is assigned yet.</p>
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
