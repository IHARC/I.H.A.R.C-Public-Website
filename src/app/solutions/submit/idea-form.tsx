'use client';

import { useMemo, useState, useTransition } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const CATEGORIES = ['Housing', 'Health', 'Policing', 'Community', 'Prevention', 'Other'];

const STEPS: Array<{ key: string; title: string; description: string }> = [
  { key: 'problem', title: 'Problem', description: 'Describe the challenge you see on the ground.' },
  { key: 'evidence', title: 'Evidence', description: 'Share data, observation, or lived-experience evidence.' },
  { key: 'proposal', title: 'Proposal', description: 'Outline the community solution being suggested.' },
  { key: 'steps', title: 'Steps', description: 'List concrete steps or partners needed to advance it.' },
  { key: 'risks', title: 'Risks', description: 'Note any risks, trade-offs, or supports required.' },
  { key: 'metrics', title: 'Metrics', description: 'Define how we will measure success or impact.' },
];

const MIN_SECTION_LENGTH = 40;

type FormState = {
  title: string;
  category: string;
  problemStatement: string;
  evidence: string;
  proposalSummary: string;
  implementationSteps: string;
  risks: string;
  successMetrics: string;
  tags: string;
};

const INITIAL_STATE: FormState = {
  title: '',
  category: 'Community',
  problemStatement: '',
  evidence: '',
  proposalSummary: '',
  implementationSteps: '',
  risks: '',
  successMetrics: '',
  tags: '',
};

export function IdeaSubmissionForm({
  rulesAcknowledged,
  displayNameConfirmed,
}: {
  rulesAcknowledged: boolean;
  displayNameConfirmed: boolean;
}) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [acknowledged, setAcknowledged] = useState(rulesAcknowledged);
  const [displayConfirmed, setDisplayConfirmed] = useState(displayNameConfirmed);
  const [confirmingDisplay, setConfirmingDisplay] = useState(false);
  const [isAnon, setIsAnon] = useState(false);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const currentStep = STEPS[step];
  const isFinalStep = step === STEPS.length - 1;

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

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 0:
        return (
          displayConfirmed &&
          form.title.trim().length >= 8 &&
          form.problemStatement.trim().length >= MIN_SECTION_LENGTH
        );
      case 1:
        return form.evidence.trim().length >= MIN_SECTION_LENGTH;
      case 2:
        return form.proposalSummary.trim().length >= MIN_SECTION_LENGTH;
      case 3:
        return form.implementationSteps.trim().length >= MIN_SECTION_LENGTH;
      case 4:
        return true; // risks optional but encouraged
      case 5:
        return form.successMetrics.trim().length >= MIN_SECTION_LENGTH;
      default:
        return false;
    }
  }, [displayConfirmed, form, step]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((current) => current - 1);
    }
  };

  const handleSubmit = () => {
    const aggregate = [
      form.title,
      form.problemStatement,
      form.evidence,
      form.proposalSummary,
      form.implementationSteps,
      form.risks,
      form.successMetrics,
    ]
      .filter(Boolean)
      .join('\n');

    const { hasPii, hasProfanity } = scanContentForSafety(aggregate);
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

    const formData = new FormData();
    formData.set('title', form.title.trim());
    formData.set('category', form.category);
    formData.set('problem_statement', form.problemStatement.trim());
    formData.set('evidence', form.evidence.trim());
    formData.set('proposal_summary', form.proposalSummary.trim());
    formData.set('implementation_steps', form.implementationSteps.trim());
    formData.set('risks', form.risks.trim());
    formData.set('success_metrics', form.successMetrics.trim());
    formData.set('tags', form.tags.trim());
    formData.set('is_anonymous', isAnon ? 'true' : 'false');
    formData.set('acknowledged', acknowledged ? 'true' : 'false');

    attachments.forEach((attachment) => {
      formData.append('attachments', attachment.file, attachment.file.name);
    });

    startTransition(async () => {
      try {
        const response = await fetch('/api/portal/ideas', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Idea submission failed');
        }
        const payload = await response.json();
        toast({
          title: 'Idea submitted',
          description: 'Thank you for contributing a community solution.',
        });
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
      <div className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500">
        {STEPS.map((item, index) => {
          const active = index === step;
          const completed = index < step;
          return (
            <span
              key={item.key}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors',
                active
                  ? 'border-brand/70 bg-brand/5 text-brand'
                  : completed
                    ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400',
              ].join(' ')}
            >
              {completed ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-medium">{index + 1}</span>}
              <span className="hidden sm:inline">{item.title}</span>
            </span>
          );
        })}
      </div>
      {!displayConfirmed && (
        <Alert className="mb-6 border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100">
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
      <section aria-labelledby="wizard-step" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 space-y-1">
          <h2 id="wizard-step" className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {currentStep.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{currentStep.description}</p>
        </div>
        <div className="space-y-5">
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="title">Idea title</Label>
                <Input
                  id="title"
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Give your idea a concise, action-focused title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(value) => updateField('category', value)}>
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
                <Label htmlFor="problem">What problem are you seeing?</Label>
                <Textarea
                  id="problem"
                  rows={6}
                  value={form.problemStatement}
                  onChange={(event) => updateField('problemStatement', event.target.value)}
                  maxLength={2000}
                  placeholder="Describe what is happening in community right now, who is impacted, and why it matters."
                />
                <p className="text-xs text-slate-500">At least {MIN_SECTION_LENGTH} characters.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(event) => updateField('tags', event.target.value)}
                  placeholder="ex: outreach, harm reduction, winter"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is_anonymous" checked={isAnon} onCheckedChange={setIsAnon} />
                <Label htmlFor="is_anonymous">Post anonymously (moderators can still view your account)</Label>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-2">
              <Label htmlFor="evidence">What evidence backs this up?</Label>
              <Textarea
                id="evidence"
                rows={6}
                value={form.evidence}
                onChange={(event) => updateField('evidence', event.target.value)}
                maxLength={2500}
                placeholder="Share data, lived experience, or observations that show this problem needs action."
              />
              <p className="text-xs text-slate-500">Evidence is required before you can continue.</p>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-2">
              <Label htmlFor="proposal">What is your proposal?</Label>
              <Textarea
                id="proposal"
                rows={6}
                value={form.proposalSummary}
                onChange={(event) => updateField('proposalSummary', event.target.value)}
                maxLength={2500}
                placeholder="Describe the community solution, supports required, and the difference it will make."
              />
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-2">
              <Label htmlFor="steps">What steps move this forward?</Label>
              <Textarea
                id="steps"
                rows={6}
                value={form.implementationSteps}
                onChange={(event) => updateField('implementationSteps', event.target.value)}
                maxLength={2500}
                placeholder="List practical steps, timelines, or partner agencies needed to pilot or test the idea."
              />
            </div>
          )}
          {step === 4 && (
            <div className="grid gap-2">
              <Label htmlFor="risks">Risks, trade-offs, or supports</Label>
              <Textarea
                id="risks"
                rows={6}
                value={form.risks}
                onChange={(event) => updateField('risks', event.target.value)}
                maxLength={2000}
                placeholder="Flag any risks, dependencies, or supports required so the team can plan mitigations."
              />
              <p className="text-xs text-slate-500">Optional but helps the review team prepare.</p>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="metrics">How will we measure success?</Label>
                <Textarea
                  id="metrics"
                  rows={6}
                  value={form.successMetrics}
                  onChange={(event) => updateField('successMetrics', event.target.value)}
                  maxLength={2500}
                  placeholder="Define what success looks like, what data to collect, or milestones that prove it is working."
                />
                <p className="text-xs text-slate-500">Metrics are required before submitting.</p>
              </div>
              <div className="grid gap-2">
                <Label>Attachments</Label>
                <AttachmentUploader attachments={attachments} onChange={setAttachments} />
                <p className="text-xs text-slate-500">Add supporting documents like PDFs, photos, or briefing notes (max 4 files).</p>
              </div>
            </div>
          )}
        </div>
        <footer className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Step {step + 1} of {STEPS.length}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0 || pending}>
              Back
            </Button>
            {!isFinalStep && (
              <Button type="button" onClick={handleNext} disabled={!stepIsValid || pending}>
                Continue
              </Button>
            )}
            {isFinalStep && (
              <Button type="button" onClick={handleSubmit} disabled={!stepIsValid || pending}>
                {pending ? 'Submitting…' : 'Submit idea'}
              </Button>
            )}
          </div>
        </footer>
      </section>
    </>
  );
}
