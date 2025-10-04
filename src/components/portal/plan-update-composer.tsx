'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface PlanUpdateComposerProps {
  planId: string;
}

const FIELD_CONFIG: Array<{ key: keyof FormState; label: string; placeholder: string; rows?: number }> = [
  {
    key: 'problem',
    label: 'Problem',
    placeholder: 'What challenge are we solving? Include who is affected and when it appears.',
  },
  {
    key: 'evidence',
    label: 'Evidence',
    placeholder: 'Link to data, partner reports, or lived experience that shows the scale of the issue.',
  },
  {
    key: 'proposed_change',
    label: 'Proposed change',
    placeholder: 'Describe the change we should test. Keep it clear enough for the community to explain.',
  },
  {
    key: 'impact',
    label: 'Impact',
    placeholder: 'What outcome do we expect? Who benefits right away? Include reach or scale.',
  },
  {
    key: 'risks',
    label: 'Risks',
    placeholder: 'List any risks, dependencies, or supports needed to make this work.',
  },
  {
    key: 'measurement',
    label: 'How we’ll measure success',
    placeholder: 'Which numbers or signals will tell us the change is working? Include frequency or target.',
  },
];

type FormState = {
  problem: string;
  evidence: string;
  proposed_change: string;
  impact: string;
  risks: string;
  measurement: string;
};

export function PlanUpdateComposer({ planId }: PlanUpdateComposerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    problem: '',
    evidence: '',
    proposed_change: '',
    impact: '',
    risks: '',
    measurement: '',
  });
  const [isPending, startTransition] = useTransition();

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const missingField = FIELD_CONFIG.find((field) => !form[field.key].trim());
    if (missingField) {
      toast({ title: `${missingField.label} is required.`, variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/portal/plans/${planId}/updates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            Object.fromEntries(
              Object.entries(form).map(([key, value]) => [key, value.trim()]),
            ),
          ),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to submit update');
        }

        toast({ title: 'Plan update posted', description: 'Moderators will review and gather feedback.' });
        setOpen(false);
        setForm({ problem: '', evidence: '', proposed_change: '', impact: '', risks: '', measurement: '' });
        router.refresh();
      } catch (error) {
        toast({
          title: 'Submission failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="justify-self-start">Propose a plan update</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose a plan update</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {FIELD_CONFIG.map((field) => (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={`plan-update-${field.key}`}>{field.label}</Label>
              <Textarea
                id={`plan-update-${field.key}`}
                rows={field.rows ?? 4}
                value={form[field.key]}
                onChange={(event) => handleChange(field.key, event.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Submitting…' : 'Submit for feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
