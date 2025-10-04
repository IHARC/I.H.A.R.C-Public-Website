'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { scanContentForSafety } from '@/lib/safety';
import { toast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function CommentComposer({ ideaId }: { ideaId: string }) {
  const [value, setValue] = useState('');
  const [commentType, setCommentType] = useState<'question' | 'suggestion'>('suggestion');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = () => {
    if (!value.trim()) return;
    const safety = scanContentForSafety(value);
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
        const response = await fetch(`/api/portal/ideas/${ideaId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: value, comment_type: commentType }),
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
          throw new Error(payload.error || 'Failed to post comment');
        }
        setValue('');
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
    <div className="space-y-2">
      <RadioGroup
        value={commentType}
        onValueChange={(next) => setCommentType(next as 'question' | 'suggestion')}
        className="flex gap-4"
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
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add a constructive comment"
        rows={4}
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isPending || !value.trim()}>
          Post comment
        </Button>
      </div>
    </div>
  );
}
