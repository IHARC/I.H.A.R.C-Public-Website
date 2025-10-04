'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { scanContentForSafety } from '@/lib/safety';
import { toast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

type ViewerRole = 'user' | 'org_rep' | 'moderator' | 'admin';

export function CommentComposer({
  ideaId,
  viewerRole = 'user',
  canPostOfficial = false,
  officialOrganizationName = null,
}: {
  ideaId: string;
  viewerRole?: ViewerRole | null;
  canPostOfficial?: boolean;
  officialOrganizationName?: string | null;
}) {
  const normalizedRole: ViewerRole = viewerRole ?? 'user';
  const [value, setValue] = useState('');
  const [commentType, setCommentType] = useState<'question' | 'suggestion'>('suggestion');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [postAsOfficial, setPostAsOfficial] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (commentType !== 'suggestion' && evidenceUrl) {
      setEvidenceUrl('');
    }
  }, [commentType, evidenceUrl]);

  useEffect(() => {
    if (!canPostOfficial) {
      setPostAsOfficial(false);
    }
  }, [canPostOfficial]);

  useEffect(() => {
    if (cooldown === null) {
      return;
    }
    if (cooldown <= 0) {
      setCooldown(null);
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        return next > 0 ? next : 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const trimmedValue = value.trim();
  const evidenceTrimmed = evidenceUrl.trim();
  const isCoolingDown = typeof cooldown === 'number' && cooldown > 0;
  const canShowOfficialToggle = canPostOfficial && normalizedRole !== 'user';
  const officialLabel = normalizedRole === 'org_rep' && officialOrganizationName
    ? `Post as ${officialOrganizationName}`
    : 'Post as official response';

  const handleSubmit = () => {
    if (!trimmedValue) return;
    const safety = scanContentForSafety(trimmedValue);
    if (safety.hasPii || safety.hasProfanity) {
      toast({
        title: 'Please revise your comment',
        description: 'Remove personal details or flagged language.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const outgoingType = canShowOfficialToggle && postAsOfficial ? 'official_note' : commentType;
        const requestPayload: Record<string, unknown> = {
          body: trimmedValue,
          comment_type: outgoingType,
        };

        if (commentType === 'suggestion' && evidenceTrimmed) {
          requestPayload.evidence_url = evidenceTrimmed;
        }

        if (canShowOfficialToggle && postAsOfficial) {
          requestPayload.is_official = true;
        }

        const response = await fetch(`/api/portal/ideas/${ideaId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        if (!response.ok) {
          if (response.status === 412) {
            toast({
              title: 'Acknowledge the community rules',
              description: 'Visit your portal profile to confirm the participation guidelines before commenting.',
              variant: 'destructive',
            });
            return;
          }
          const payload = await response.json().catch(() => ({}));
          if (response.status === 429 && typeof payload.retry_in_ms === 'number') {
            setCooldown(Math.ceil(payload.retry_in_ms / 1000));
            toast({
              title: 'Cooling down',
              description: 'Thanks for staying constructive. Give it a moment before posting again.',
              variant: 'destructive',
            });
            return;
          }
          throw new Error(payload.error || 'Failed to post comment');
        }
        setValue('');
        setEvidenceUrl('');
        setPostAsOfficial(false);
        router.refresh();
      } catch (error) {
        toast({
          title: 'Comment failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-3">
      {isCoolingDown && (
        <Alert className="border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Cooldown active</AlertTitle>
          <AlertDescription>
            Give it about {cooldown} second{cooldown === 1 ? '' : 's'} before posting again so everyone has space to respond.
          </AlertDescription>
        </Alert>
      )}
      <RadioGroup
        value={commentType}
        onValueChange={(nextValue: string) =>
          setCommentType((nextValue as 'question' | 'suggestion') ?? 'suggestion')
        }
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="question" id="comment-question" />
          <Label htmlFor="comment-question" className="text-sm font-medium">
            Question
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="suggestion" id="comment-suggestion" />
          <Label htmlFor="comment-suggestion" className="text-sm font-medium">
            Suggestion
          </Label>
        </div>
      </RadioGroup>
      {canShowOfficialToggle && (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Switch id="official-comment" checked={postAsOfficial} onCheckedChange={setPostAsOfficial} />
          <Label htmlFor="official-comment" className="cursor-pointer font-medium text-slate-700 dark:text-slate-200">
            {officialLabel}
          </Label>
        </div>
      )}
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={
          canShowOfficialToggle && postAsOfficial
            ? 'Share an official update, decision, or next step'
            : commentType === 'question'
              ? 'Ask for clarification or implementation details'
              : 'Share a constructive suggestion that moves this forward'
        }
        rows={4}
        maxLength={2000}
      />
      {commentType === 'suggestion' && (
        <div className="space-y-2">
          <Label htmlFor="evidence-url" className="text-sm font-medium">
            Attach evidence (optional)
          </Label>
          <Input
            id="evidence-url"
            value={evidenceUrl}
            onChange={(event) => setEvidenceUrl(event.target.value)}
            inputMode="url"
            placeholder="https://example.org/report.pdf"
            maxLength={600}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Link to data, news updates, or partner documentation so moderators can verify quickly.
          </p>
          {!evidenceTrimmed && (
            <p className="text-xs text-amber-600 dark:text-amber-300">
              Evidence links keep the sprint focused on measurable progress.
            </p>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isPending || !trimmedValue || isCoolingDown}>
          Post comment
        </Button>
      </div>
    </div>
  );
}
