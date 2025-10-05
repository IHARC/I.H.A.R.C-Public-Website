'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AttachmentDraft, AttachmentUploader } from '@/components/portal/attachment-uploader';
import { CommunityStandardsCallout } from '@/components/portal/community-standards';
import { toast } from '@/components/ui/use-toast';
import { scanContentForSafety } from '@/lib/safety';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { copyDeck } from '@/lib/copy';

export const IDEA_CATEGORIES = ['Housing', 'Health', 'Policing', 'Community', 'Prevention', 'Other'] as const;
const formCopy = copyDeck.ideas.form;

const STEPS: Array<{ key: string; title: string; description: string }> = [
  { key: 'problem', title: 'Problem', description: 'Describe the challenge you see on the ground.' },
  { key: 'evidence', title: 'Evidence', description: 'Share data, observation, or lived-experience evidence.' },
  { key: 'proposal', title: 'Proposal', description: 'Outline the community solution being suggested.' },
  { key: 'steps', title: 'Steps', description: 'List concrete steps or partners needed to advance it.' },
  { key: 'risks', title: 'Risks', description: 'Note any risks, trade-offs, or supports required.' },
  { key: 'metrics', title: 'Metrics', description: 'Define how we will measure success or impact.' },
];

const MIN_SECTION_LENGTH = 40;
const MAX_METRICS = 6;

type MetricDraft = {
  id: string;
  label: string;
  definition: string;
  baseline: string;
  target: string;
};

type FormState = {
  title: string;
  category: string;
  problemStatement: string;
  evidence: string;
  proposalSummary: string;
  implementationSteps: string;
  risks: string;
  tags: string;
};

type ExistingMetric = {
  id?: string;
  label: string;
  definition: string | null;
  baseline: string | null;
  target: string | null;
};

type IdeaSubmissionMode = 'create' | 'update';

type IdeaInitialData = {
  title: string;
  category: string;
  problemStatement?: string | null;
  evidence?: string | null;
  proposalSummary?: string | null;
  implementationSteps?: string | null;
  risks?: string | null;
  tags: string[];
  isAnonymous: boolean;
  metrics: ExistingMetric[];
};

const INITIAL_STATE: FormState = {
  title: '',
  category: 'Community',
  problemStatement: '',
  evidence: '',
  proposalSummary: '',
  implementationSteps: '',
  risks: '',
  tags: '',
};

const createMetricDraft = (): MetricDraft => ({
  id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  label: '',
  definition: '',
  baseline: '',
  target: '',
});

export function IdeaSubmissionForm({
  rulesAcknowledged,
  displayNameConfirmed,
  ideaId,
  initialIdea,
  mode = 'create',
}: {
  rulesAcknowledged: boolean;
  displayNameConfirmed: boolean;
  ideaId?: string;
  initialIdea?: IdeaInitialData;
  mode?: IdeaSubmissionMode;
}) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [acknowledged, setAcknowledged] = useState(rulesAcknowledged);
  const [displayConfirmed, setDisplayConfirmed] = useState(displayNameConfirmed);
  const [confirmingDisplay, setConfirmingDisplay] = useState(false);
  const [isAnon, setIsAnon] = useState(initialIdea?.isAnonymous ?? false);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => ({
    title: initialIdea?.title ?? INITIAL_STATE.title,
    category: initialIdea?.category ?? INITIAL_STATE.category,
    problemStatement: initialIdea?.problemStatement ?? '',
    evidence: initialIdea?.evidence ?? '',
    proposalSummary: initialIdea?.proposalSummary ?? '',
    implementationSteps: initialIdea?.implementationSteps ?? '',
    risks: initialIdea?.risks ?? '',
    tags: initialIdea?.tags?.join(', ') ?? '',
  }));
  const [metrics, setMetrics] = useState<MetricDraft[]>(() =>
    initialIdea?.metrics?.length
      ? initialIdea.metrics.map((metric) => {
          const base = createMetricDraft();
          return {
            ...base,
            id: metric.id ?? base.id,
            label: metric.label,
            definition: metric.definition ?? '',
            baseline: metric.baseline ?? '',
            target: metric.target ?? '',
          };
        })
      : [createMetricDraft()],
  );
  const [cooldown, setCooldown] = useState<number | null>(null);

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

  const currentStep = STEPS[step];
  const isFinalStep = step === STEPS.length - 1;
  const isCoolingDown = mode === 'create' && typeof cooldown === 'number' && cooldown > 0;
  const submitLabel = mode === 'update' ? 'Publish full proposal' : 'Submit idea';
  const pendingLabel = mode === 'update' ? 'Publishing…' : 'Submitting…';

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

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPlaceholder = (field: keyof FormState, placeholder: string) => {
    setForm((prev) => ({ ...prev, [field]: placeholder }));
  };

  const updateMetric = <K extends keyof Omit<MetricDraft, 'id'>>(metricId: string, key: K, value: MetricDraft[K]) => {
    setMetrics((prev) =>
      prev.map((metric) => (metric.id === metricId ? { ...metric, [key]: value } : metric)),
    );
  };

  const applyMetricPlaceholder = () => {
    const base = createMetricDraft();
    setMetrics([
      {
        ...base,
        label: formCopy.placeholders.metrics.label,
        definition: formCopy.placeholders.metrics.definition,
        baseline: '',
        target: '',
      },
    ]);
  };

  const addMetric = () => {
    setMetrics((prev) => {
      if (prev.length >= MAX_METRICS) return prev;
      return [...prev, createMetricDraft()];
    });
  };

  const removeMetric = (metricId: string) => {
    setMetrics((prev) => (prev.length === 1 ? prev : prev.filter((metric) => metric.id !== metricId)));
  };

  const metricsAreValid = useMemo(
    () =>
      metrics.some((metric) => {
        const label = metric.label.trim();
        if (label.length < 3) return false;
        const hasDetail = metric.definition.trim().length > 0 || metric.target.trim().length > 0 || metric.baseline.trim().length > 0;
        return hasDetail;
      }),
    [metrics],
  );

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
        return metricsAreValid;
      default:
        return false;
    }
  }, [displayConfirmed, form, step, metricsAreValid]);

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
    const normalizedMetrics = metrics
      .map((metric) => ({
        label: metric.label.trim(),
        definition: metric.definition.trim(),
        baseline: metric.baseline.trim(),
        target: metric.target.trim(),
      }))
      .filter((metric) => metric.label.length > 0);

    if (!normalizedMetrics.length) {
      toast({
        title: 'Add your success metrics',
        description: 'Define at least one measurable indicator before submitting.',
        variant: 'destructive',
      });
      return;
    }

    const metricsAggregate = normalizedMetrics
      .map((metric) => `${metric.label} ${metric.definition} ${metric.baseline} ${metric.target}`.trim())
      .join('\n');

    const aggregate = [
      form.title,
      form.problemStatement,
      form.evidence,
      form.proposalSummary,
      form.implementationSteps,
      form.risks,
      metricsAggregate,
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
    formData.set('tags', form.tags.trim());
    formData.set('is_anonymous', isAnon ? 'true' : 'false');
    formData.set('acknowledged', acknowledged ? 'true' : 'false');
    formData.set('metrics', JSON.stringify(normalizedMetrics));
    formData.set('submission_type', 'full');

    if (mode === 'create') {
      attachments.forEach((attachment) => {
        formData.append('attachments', attachment.file, attachment.file.name);
      });
    }

    if (mode === 'update' && !ideaId) {
      toast({
        title: 'Unable to update idea',
        description: 'Missing idea identifier. Reload the page and try again.',
        variant: 'destructive',
      });
      return;
    }

    const endpoint = mode === 'update' ? `/api/portal/ideas/${ideaId}` : '/api/portal/ideas';
    const method = mode === 'update' ? 'PATCH' : 'POST';

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method,
          body: formData,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          if (response.status === 429 && typeof payload.retry_in_ms === 'number') {
            if (mode === 'create') {
              setCooldown(Math.ceil(payload.retry_in_ms / 1000));
              toast({
                title: 'Cooldown in effect',
                description: 'Please wait before submitting another idea.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Rate limited',
                description: 'Please wait a moment and try saving again.',
                variant: 'destructive',
              });
            }
            return;
          }
          throw new Error(payload.error || (mode === 'update' ? 'Idea update failed' : 'Idea submission failed'));
        }
        const payload = await response.json();
        toast({
          title: mode === 'update' ? 'Idea updated' : 'Idea submitted',
          description:
            mode === 'update'
              ? 'Full details saved. Neighbours can now review the complete proposal.'
              : 'Thank you for contributing a community solution.',
        });
        router.push(`/solutions/${payload.id}`);
      } catch (error) {
        toast({
          title: mode === 'update' ? 'Unable to update idea' : 'Unable to submit idea',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <CommunityStandardsCallout acknowledged={acknowledged} onAcknowledge={handleRulesAcknowledge} />
      {mode === 'create' && typeof cooldown === 'number' && cooldown > 0 && (
        <Alert className="mb-4 border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Cooling down</AlertTitle>
          <AlertDescription>
            Thanks for the momentum. You can submit another idea in approximately {cooldown} second{cooldown === 1 ? '' : 's'}.
          </AlertDescription>
        </Alert>
      )}
      <div className="mb-6 flex flex-wrap gap-2 text-sm text-muted">
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
                    : 'border-slate-200 text-muted dark:border-slate-800',
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
          <p className="text-sm text-muted">{currentStep.description}</p>
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
                    {IDEA_CATEGORIES.map((category) => (
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
                <p className="text-xs text-muted">At least {MIN_SECTION_LENGTH} characters.</p>
                <div className="flex flex-col gap-1 text-xs text-muted">
                  <span>{formCopy.examples.problem}</span>
                  <button
                    type="button"
                    className="self-start text-brand underline transition hover:text-brand/80"
                    onClick={() => applyPlaceholder('problemStatement', formCopy.placeholders.problem)}
                  >
                    I need help capturing this
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(event) => updateField('tags', event.target.value)}
                  placeholder="ex: outreach, drug poisoning response, winter"
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
              <p className="text-xs text-muted">Evidence is required before you can continue.</p>
              {form.evidence.trim().length < MIN_SECTION_LENGTH && (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Cite a statistic, observation, or peer insight so moderators can validate quickly.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{formCopy.examples.evidence}</span>
                <Link
                  href={formCopy.links.evidence.href}
                  className="text-brand underline transition hover:text-brand/80"
                  target="_blank"
                >
                  {formCopy.links.evidence.label}
                </Link>
                <button
                  type="button"
                  className="text-brand underline transition hover:text-brand/80"
                  onClick={() => applyPlaceholder('evidence', formCopy.placeholders.evidence)}
                >
                  I need help sourcing evidence
                </button>
              </div>
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{formCopy.examples.proposedChange}</span>
                <button
                  type="button"
                  className="text-brand underline transition hover:text-brand/80"
                  onClick={() => applyPlaceholder('proposalSummary', formCopy.placeholders.proposal)}
                >
                  Draft placeholder
                </button>
              </div>
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{formCopy.examples.steps}</span>
                <button
                  type="button"
                  className="text-brand underline transition hover:text-brand/80"
                  onClick={() => applyPlaceholder('implementationSteps', formCopy.placeholders.steps)}
                >
                  I need help mapping steps
                </button>
              </div>
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
              <p className="text-xs text-muted">Optional but helps the review team prepare.</p>
              <span className="text-xs text-muted">{formCopy.examples.risks}</span>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Success metrics</Label>
                      <p className="text-xs text-muted">
                        Define how neighbours will know the idea is working. Include targets or key dates.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addMetric}
                      disabled={metrics.length >= MAX_METRICS}
                    >
                      Add metric
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{formCopy.examples.metrics}</span>
                    <Link
                      href={formCopy.links.metrics.href}
                      className="text-brand underline transition hover:text-brand/80"
                      target="_blank"
                    >
                      {formCopy.links.metrics.label}
                    </Link>
                    <button
                      type="button"
                      className="text-brand underline transition hover:text-brand/80"
                      onClick={applyMetricPlaceholder}
                    >
                      I don&apos;t know yet
                    </button>
                  </div>
                  <span className="text-xs text-muted">{formCopy.examples.metricsFallback}</span>
                  <div className="space-y-4">
                    {metrics.map((metric, index) => {
                    const metricLabelId = `metric-${metric.id}-label`;
                    const metricDefinitionId = `metric-${metric.id}-definition`;
                    const baselineId = `metric-${metric.id}-baseline`;
                    const targetId = `metric-${metric.id}-target`;
                    const showRemove = metrics.length > 1;
                    return (
                      <div
                        key={metric.id}
                        className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Metric {index + 1}
                          </span>
                          {showRemove && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMetric(metric.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={metricLabelId}>Metric title</Label>
                          <Input
                            id={metricLabelId}
                            value={metric.label}
                            maxLength={160}
                            onChange={(event) => updateMetric(metric.id, 'label', event.target.value)}
                            placeholder="Ex: Encampment outreach visits completed"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={metricDefinitionId}>Definition or methodology</Label>
                          <Textarea
                            id={metricDefinitionId}
                            rows={3}
                            maxLength={500}
                            value={metric.definition}
                            onChange={(event) => updateMetric(metric.id, 'definition', event.target.value)}
                            placeholder="What counts towards this metric? Which partners are reporting it?"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor={baselineId}>Baseline (optional)</Label>
                            <Input
                              id={baselineId}
                              value={metric.baseline}
                              maxLength={120}
                              onChange={(event) => updateMetric(metric.id, 'baseline', event.target.value)}
                              placeholder="Ex: 12 visits per week"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={targetId}>Target / goal</Label>
                            <Input
                              id={targetId}
                              value={metric.target}
                              maxLength={120}
                              onChange={(event) => updateMetric(metric.id, 'target', event.target.value)}
                              placeholder="Ex: Increase to 20 visits by January"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!metricsAreValid && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Add detail or a target so moderators can validate the metric with partners.
                  </p>
                )}
              </div>
              {mode === 'create' ? (
                <div className="grid gap-2">
                  <Label>Attachments</Label>
                  <AttachmentUploader attachments={attachments} onChange={setAttachments} />
                  <p className="text-xs text-muted">
                    Add supporting documents like PDFs, photos, or briefing notes (max 4 files).
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <footer className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="text-xs text-muted">
            Step {step + 1} of {STEPS.length}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0 || pending}>
              Back
            </Button>
            {!isFinalStep && (
              <Button type="button" onClick={handleNext} disabled={!stepIsValid || pending || isCoolingDown}>
                Continue
              </Button>
            )}
            {isFinalStep && (
              <Button type="button" onClick={handleSubmit} disabled={!stepIsValid || pending || isCoolingDown}>
                {pending ? pendingLabel : submitLabel}
              </Button>
            )}
          </div>
        </footer>
      </section>
    </>
  );
}
