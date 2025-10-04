'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/types/supabase';

type PlanUpdateStatus = Database['portal']['Enums']['plan_update_status'];

interface PlanUpdateModeratorActionsProps {
  updateId: string;
  currentStatus: PlanUpdateStatus;
  planSummary: string;
}

type ActionType = 'accept' | 'decline' | 'added' | 'reopen';

export function PlanUpdateModeratorActions({
  updateId,
  currentStatus,
  planSummary,
}: PlanUpdateModeratorActionsProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<ActionType | null>(null);
  const [decisionSummary, setDecisionSummary] = useState('');
  const [summaryUpdate, setSummaryUpdate] = useState(planSummary);
  const [isPending, startTransition] = useTransition();

  const closeDialog = () => {
    setDialog(null);
    setDecisionSummary('');
    setSummaryUpdate(planSummary);
  };

  const runAction = (action: ActionType) => {
    startTransition(async () => {
      try {
        let body: Record<string, unknown> = {};
        switch (action) {
          case 'accept':
            body = { status: 'accepted', decision_summary: decisionSummary.trim() };
            break;
          case 'decline':
            body = { status: 'not_moving_forward', decision_summary: decisionSummary.trim() };
            break;
          case 'added':
            body = { status: 'added_to_plan', summary_update: summaryUpdate.trim() };
            break;
          case 'reopen':
            body = { status: 'open' };
            break;
        }

        const response = await fetch(`/api/portal/plans/updates/${updateId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to update status');
        }

        toast({ title: 'Plan update updated' });
        closeDialog();
        router.refresh();
      } catch (error) {
        toast({
          title: 'Update failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={dialog === 'reopen'} onOpenChange={(open) => (open ? setDialog('reopen') : closeDialog())}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" disabled={currentStatus === 'open'}>
            Reopen feedback
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reopen this update?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will move the update back to “Open for feedback”.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => runAction('reopen')} disabled={isPending}>
              Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'accept'} onOpenChange={(open) => (open ? setDialog('accept') : closeDialog())}>
        <DialogTrigger asChild>
          <Button size="sm" disabled={currentStatus === 'accepted' || currentStatus === 'added_to_plan'}>
            Accept
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Why are we accepting this update?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="decision-summary-accept">Decision note</Label>
            <Textarea
              id="decision-summary-accept"
              value={decisionSummary}
              onChange={(event) => setDecisionSummary(event.target.value)}
              rows={4}
              placeholder="Explain what happens next and why this update is moving forward."
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => runAction('accept')} disabled={isPending || !decisionSummary.trim()}>
              Save decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'decline'} onOpenChange={(open) => (open ? setDialog('decline') : closeDialog())}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary" disabled={currentStatus === 'not_moving_forward'}>
            Not moving forward
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share the decision context</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="decision-summary-decline">Decision note</Label>
            <Textarea
              id="decision-summary-decline"
              value={decisionSummary}
              onChange={(event) => setDecisionSummary(event.target.value)}
              rows={4}
              placeholder="Explain why this update is not moving forward right now."
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => runAction('decline')} disabled={isPending || !decisionSummary.trim()}>
              Save decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'added'} onOpenChange={(open) => (open ? setDialog('added') : closeDialog())}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={currentStatus !== 'accepted'}>
            Mark added to plan
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update the overview summary</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="summary-update">Plan overview</Label>
            <Textarea
              id="summary-update"
              value={summaryUpdate}
              onChange={(event) => setSummaryUpdate(event.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => runAction('added')} disabled={isPending || !summaryUpdate.trim()}>
              Save overview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
