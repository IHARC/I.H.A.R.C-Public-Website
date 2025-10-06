'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { slugifyPlanSlug } from '@/lib/plans';

interface PromoteIdeaCardProps {
  ideaId: string;
  ideaTitle: string;
  defaultSummary: string;
  voteCount: number;
  supportThreshold: number;
  infoComplete: boolean;
  hasVerifiedSponsor: boolean;
  defaultFocusAreas: string[];
  publicationStatus: 'draft' | 'published' | 'archived';
}

export function PromoteIdeaCard({
  ideaId,
  ideaTitle,
  defaultSummary,
  voteCount,
  supportThreshold,
  infoComplete,
  hasVerifiedSponsor,
  defaultFocusAreas,
  publicationStatus,
}: PromoteIdeaCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(ideaTitle);
  const [summary, setSummary] = useState(defaultSummary);
  const [slug, setSlug] = useState(slugifyPlanSlug(ideaTitle));
  const [focusText, setFocusText] = useState(defaultFocusAreas.join('\n'));
  const [keyDateTitle, setKeyDateTitle] = useState('Kick-off session');
  const [keyDateDate, setKeyDateDate] = useState('');
  const [keyDateNotes, setKeyDateNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const supportSatisfied = voteCount >= supportThreshold;
  const isDraft = publicationStatus === 'draft';
  const criteriaMet = !isDraft && (hasVerifiedSponsor || (supportSatisfied && infoComplete));

  const focusAreaCount = useMemo(() => focusText.split('\n').map((line) => line.trim()).filter(Boolean).length, [focusText]);

  const handleSubmit = () => {
    startTransition(async () => {
      const focusAreas = focusText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (!focusAreas.length) {
        toast({ title: 'Add focus areas', description: 'Include at least one focus area to continue.', variant: 'destructive' });
        return;
      }

      if (!keyDateTitle.trim() || !keyDateDate) {
        toast({ title: 'Key date required', description: 'Set the first key date before promoting.', variant: 'destructive' });
        return;
      }

      try {
        const response = await fetch('/api/portal/plans/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea_id: ideaId,
            title: title.trim(),
            summary: summary.trim(),
            slug: slugifyPlanSlug(slug || title),
            focus_areas: focusAreas,
            key_date: {
              title: keyDateTitle.trim(),
              date: keyDateDate,
              notes: keyDateNotes.trim() || undefined,
            },
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Promotion failed');
        }

        const payload = await response.json();
        toast({ title: 'Working Plan created', description: 'Redirecting to the plan overview.' });
        setOpen(false);
        router.push(`/plans/${payload.slug}`);
        router.refresh();
      } catch (error) {
        toast({
          title: 'Unable to promote idea',
          description: error instanceof Error ? error.message : 'Try again after refreshing.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Working Plan promotion
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Needs {supportThreshold}+ positive reactions and every section completed, or a verified partner sponsor.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-subtle">
              <Info className="h-4 w-4" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Promotion locks the idea summary and opens the plan tabs for community collaboration.
          </TooltipContent>
        </Tooltip>
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          {!isDraft ? (
            <CheckCircle2 className="h-4 w-4 text-brand" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span>Idea published (not marked as draft)</span>
        </li>
        <li className="flex items-center gap-2">
          {supportSatisfied ? (
            <CheckCircle2 className="h-4 w-4 text-brand" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span>{voteCount} positive reactions (needs {supportThreshold})</span>
        </li>
        <li className="flex items-center gap-2">
          {infoComplete ? (
            <CheckCircle2 className="h-4 w-4 text-brand" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span>All required idea sections completed</span>
        </li>
        <li className="flex items-center gap-2">
          {hasVerifiedSponsor ? (
            <CheckCircle2 className="h-4 w-4 text-brand" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span>Verified partner sponsoring</span>
        </li>
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full justify-center" disabled={!criteriaMet}>
            Promote to Working Plan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirm Working Plan details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-title">Plan title</Label>
              <Input
                id="plan-title"
                value={title}
                maxLength={140}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!slug.trim()) {
                    setSlug(slugifyPlanSlug(event.target.value));
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-slug">Plan URL slug</Label>
              <Input
                id="plan-slug"
                value={slug}
                maxLength={80}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="working-plan-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-summary">Plain-language summary</Label>
              <Textarea
                id="plan-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-focus">Focus areas (one per line)</Label>
              <Textarea
                id="plan-focus"
                value={focusText}
                onChange={(event) => setFocusText(event.target.value)}
                rows={Math.max(4, focusAreaCount)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key-date-title">First key date title</Label>
              <Input
                id="key-date-title"
                value={keyDateTitle}
                onChange={(event) => setKeyDateTitle(event.target.value)}
                maxLength={140}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key-date-date">First key date</Label>
              <Input
                id="key-date-date"
                type="date"
                value={keyDateDate}
                onChange={(event) => setKeyDateDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key-date-notes">Notes (optional)</Label>
              <Textarea
                id="key-date-notes"
                value={keyDateNotes}
                onChange={(event) => setKeyDateNotes(event.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Promoting…' : 'Create Working Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
