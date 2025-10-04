'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

export type ModerationFlag = {
  id: string;
  entity_type: 'idea' | 'comment';
  entity_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter?: { display_name: string | null } | null;
  idea?: { title: string | null; status: string | null } | null;
  comment?: { body: string | null; idea_id: string | null; is_official: boolean | null } | null;
};

export function ModerationQueue({ flags }: { flags: ModerationFlag[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');

  const toggleFlag = (flagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(flagId)) {
        next.delete(flagId);
      } else {
        next.add(flagId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === flags.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(flags.map((flag) => flag.id)));
    }
  };

  const handleAction = (status: 'resolved' | 'rejected') => {
    if (!selected.size) {
      toast({ title: 'Select at least one flag', variant: 'destructive' });
      return;
    }

    if (!note.trim()) {
      toast({ title: 'Add a note', description: 'Every action must include a visible note for the idea.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      try {
        await Promise.all(
          Array.from(selected).map(async (flagId) => {
            const response = await fetch('/api/portal/moderate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'resolve_flag',
                flag_id: flagId,
                status,
                notes: note.trim(),
              }),
            });
            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              throw new Error(payload.error || 'Moderation failed');
            }
          }),
        );

        toast({
          title: status === 'resolved' ? 'Flags resolved' : 'Flags rejected',
          description: `${selected.size} item(s) updated.`,
        });
        setSelected(new Set());
        setNote('');
        router.refresh();
      } catch (error) {
        toast({
          title: 'Moderation error',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  if (!flags.length) {
    return <p className="text-sm text-slate-500">No active flags 🎉</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} disabled={isPending}>
            {selected.size === flags.length ? 'Clear selection' : 'Select all'}
          </Button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{selected.size} selected</span>
          </div>
        </div>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Moderator note (visible on idea timeline)"
          rows={3}
        />
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={() => handleAction('resolved')} disabled={isPending}>
            Resolve selected
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleAction('rejected')} disabled={isPending}>
            Reject selected
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {flags.map((flag) => {
          const isChecked = selected.has(flag.id);
          return (
            <div
              key={flag.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleFlag(flag.id)}
                    aria-label={`Select flag ${flag.id}`}
                  />
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {flag.reason.replace('_', ' ')} • {flag.entity_type}
                  </div>
                </div>
                <time className="text-xs text-slate-400" dateTime={flag.created_at}>
                  {new Date(flag.created_at).toLocaleString('en-CA')}
                </time>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {flag.entity_type === 'idea' && (
                  <div>
                    <p className="font-semibold">{flag.idea?.title ?? 'Idea'}</p>
                    <p className="text-xs text-slate-500">Current status: {flag.idea?.status ?? 'unknown'}</p>
                  </div>
                )}
                {flag.entity_type === 'comment' && (
                  <div className="rounded bg-slate-100 p-2 text-sm dark:bg-slate-800">
                    {flag.comment?.body}
                  </div>
                )}
                {flag.details && <p className="text-xs text-slate-500">Reporter note: {flag.details}</p>}
                <p className="text-xs text-slate-400">Reported by {flag.reporter?.display_name ?? 'Community member'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
