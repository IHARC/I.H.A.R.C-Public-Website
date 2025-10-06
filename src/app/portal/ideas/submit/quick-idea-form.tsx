'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { CommunityStandardsCallout } from '@/components/portal/community-standards';
import { copyDeck } from '@/lib/copy';
import { IDEA_CATEGORIES } from './idea-form';
import { ShieldAlert } from 'lucide-react';

const quickCopy = copyDeck.ideas.quick;

export function QuickIdeaForm({
  rulesAcknowledged,
  displayNameConfirmed,
}: {
  rulesAcknowledged: boolean;
  displayNameConfirmed: boolean;
}) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(rulesAcknowledged);
  const [displayConfirmed, setDisplayConfirmed] = useState(displayNameConfirmed);
  const [confirmingDisplay, setConfirmingDisplay] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<(typeof IDEA_CATEGORIES)[number]>('Community');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [pending, startTransition] = useTransition();

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
    }
  };

  const handleConfirmDisplay = async () => {
    setConfirmingDisplay(true);
    try {
      const response = await fetch('/api/portal/profile/confirm-display', { method: 'POST' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to confirm display name');
      }
      setDisplayConfirmed(true);
      toast({
        title: 'Display name confirmed',
        description: 'Thanks for helping neighbours know who is speaking.',
      });
    } catch (error) {
      toast({
        title: 'Unable to confirm display name',
        description: error instanceof Error ? error.message : 'Try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setConfirmingDisplay(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!acknowledged) {
      toast({
        title: 'Review the community standards',
        description: 'Please agree to the standards before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!displayConfirmed) {
      toast({
        title: 'Confirm your display name',
        description: 'Moderators need to know who is contributing.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedSummary = summary.trim();

    if (trimmedTitle.length < 8) {
      toast({
        title: 'Title too short',
        description: 'Give your idea a title that helps neighbours recognise it.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedSummary.length < 24) {
      toast({
        title: 'Add a bit more detail',
        description: 'Share a couple of sentences so people understand the idea.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.set('title', trimmedTitle);
    formData.set('category', category);
    formData.set('quick_summary', trimmedSummary);
    formData.set('tags', tags);
    formData.set('is_anonymous', isAnon ? 'true' : 'false');
    formData.set('acknowledged', acknowledged ? 'true' : 'false');
    formData.set('submission_type', 'quick');

    startTransition(async () => {
      try {
        const response = await fetch('/api/portal/ideas', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Quick Idea submission failed');
        }
        const payload = await response.json();
        toast({
          title: 'Quick Idea posted',
          description: quickCopy.nudge,
        });
        router.push(`/solutions/${payload.id}`);
      } catch (error) {
        toast({
          title: 'Unable to submit',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CommunityStandardsCallout acknowledged={acknowledged} onAcknowledge={handleRulesAcknowledge} />
      {!displayConfirmed && (
        <Alert className="border-primary/30 bg-primary/10 text-on-primary-container">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Confirm your display name</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Moderators need to know who is contributing. Confirm your display name before moving ahead. You can
              update it on your profile if needed.
            </p>
            <Button size="sm" variant="outline" onClick={handleConfirmDisplay} disabled={confirmingDisplay}>
              {confirmingDisplay ? 'Confirming…' : 'Confirm my display name'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{quickCopy.name}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{quickCopy.description}</p>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="quick-title">Idea title</Label>
            <Input
              id="quick-title"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Warm line volunteers check on shelter waitlists by 6pm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quick-summary">Short description</Label>
            <Textarea
              id="quick-summary"
              value={summary}
              rows={4}
              maxLength={600}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="What problem do you see and what solution would help? Keep it under a few sentences."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quick-category">Focus area</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as (typeof IDEA_CATEGORIES)[number])}>
              <SelectTrigger id="quick-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {IDEA_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quick-tags">Tags (comma separated)</Label>
            <Input
              id="quick-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="ex: winter, shelter intake, compassionate supports"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="quick-anon" checked={isAnon} onCheckedChange={setIsAnon} />
            <Label htmlFor="quick-anon">Post anonymously (moderators can still view your account)</Label>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Submitting…' : quickCopy.name}
        </Button>
      </div>
    </form>
  );
}
