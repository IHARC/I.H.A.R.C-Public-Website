'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AttachmentDraft, AttachmentUploader } from '@/components/portal/attachment-uploader';
import { RulesModal } from '@/components/portal/rules-modal';
import { toast } from '@/components/ui/use-toast';
import { scanContentForSafety } from '@/lib/safety';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['Housing', 'Health', 'Policing', 'Community', 'Prevention', 'Other'];

export function IdeaSubmissionForm({
  profileId,
  rulesAcknowledged,
}: {
  profileId: string;
  rulesAcknowledged: boolean;
}) {
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [acknowledged, setAcknowledged] = useState(rulesAcknowledged);
  const [isAnon, setIsAnon] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleRulesAcknowledge = async () => {
    try {
      const response = await fetch('/api/portal/profile/ack', { method: 'POST' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to record acknowledgement');
      }
      setAcknowledged(true);
      toast({
        title: 'Thank you',
        description: 'Community participation rules acknowledged.',
      });
    } catch (error) {
      toast({
        title: 'Unable to acknowledge rules',
        description: error instanceof Error ? error.message : 'Try again shortly.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const body = formData.get('body') as string;
    const { hasPii, hasProfanity } = scanContentForSafety(`${formData.get('title')}\n${body}`);
    if (hasPii || hasProfanity) {
      toast({
        title: 'Please revise your idea',
        description: 'Content seems to include restricted language or personal info.',
        variant: 'destructive',
      });
      return;
    }

    if (!acknowledged) {
      toast({
        title: 'Review the community rules',
        description: 'You must acknowledge the rules before posting.',
        variant: 'destructive',
      });
      return;
    }

    attachments.forEach((attachment) => {
      formData.append('attachments', attachment.file, attachment.file.name);
    });
    formData.append('acknowledged', acknowledged ? 'true' : 'false');
    formData.set('is_anonymous', isAnon ? 'true' : 'false');

    startTransition(async () => {
      try {
        const response = await fetch('/api/portal/ideas', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          if (response.status === 412) {
            toast({
              title: 'Review your profile',
              description: 'Please acknowledge the community rules before posting an idea.',
              variant: 'destructive',
            });
            return;
          }
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Idea submission failed');
        }
        const payload = await response.json();
        toast({ title: 'Idea submitted', description: 'Thank you for contributing a community solution.' });
        router.push(`/solutions/${payload.id}`);
      } catch (error) {
        toast({
          title: 'Unable to submit idea',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <RulesModal open={!acknowledged} onAcknowledge={handleRulesAcknowledge} />
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Idea title</Label>
          <Input id="title" name="title" required maxLength={120} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="Community" required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="body">Describe the solution</Label>
          <Textarea
            id="body"
            name="body"
            rows={8}
            required
            maxLength={4000}
            placeholder="Outline the challenge, your proposed solution, and any community partners involved."
          />
          <p className="text-xs text-slate-500">No personal identifying information. Keep it community-focused.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" placeholder="ex: outreach, harm reduction" />
        </div>
        <div className="grid gap-2">
          <Label>Attachments</Label>
          <AttachmentUploader attachments={attachments} onChange={setAttachments} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_anonymous" checked={isAnon} onCheckedChange={setIsAnon} />
          <Label htmlFor="is_anonymous">Post anonymously (moderators can still view your account)</Label>
        </div>
        <Button type="submit" disabled={pending} className="justify-self-start">
          Submit idea
        </Button>
      </form>
    </>
  );
}
