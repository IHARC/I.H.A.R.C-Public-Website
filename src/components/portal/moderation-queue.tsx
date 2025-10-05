'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

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
  const [activeStatus, setActiveStatus] = useState<'open' | 'reviewing' | 'actioned'>('open');

  const groupedFlags = useMemo(
    () => ({
      open: flags.filter((flag) => flag.status === 'open'),
      reviewing: flags.filter((flag) => flag.status === 'reviewing'),
      actioned: flags.filter((flag) => flag.status === 'resolved' || flag.status === 'rejected'),
    }),
    [flags],
  );

  const filteredFlags = useMemo(() => {
    switch (activeStatus) {
      case 'reviewing':
        return groupedFlags.reviewing;
      case 'actioned':
        return groupedFlags.actioned;
      case 'open':
      default:
        return groupedFlags.open;
    }
  }, [activeStatus, groupedFlags]);

  const visibleSelected = useMemo(
    () => filteredFlags.filter((flag) => selected.has(flag.id)).map((flag) => flag.id),
    [filteredFlags, selected],
  );

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

  const selectAllVisible = () => {
    const visibleIds = filteredFlags.map((flag) => flag.id);
    const allSelected = visibleIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleAction = (status: 'resolved' | 'rejected' | 'reviewing') => {
    if (!visibleSelected.length) {
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
          visibleSelected.map(async (flagId) => {
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

        const actionTitle =
          status === 'resolved'
            ? 'Flags resolved'
            : status === 'reviewing'
              ? 'Flags marked for follow-up'
              : 'Flags rejected';
        toast({
          title: actionTitle,
          description: `${visibleSelected.length} item(s) updated.`,
        });
        setSelected((prev) => {
          const next = new Set(prev);
          visibleSelected.forEach((id) => next.delete(id));
          return next;
        });
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

  const tabOptions: Array<{ value: 'open' | 'reviewing' | 'actioned'; label: string; description: string; count: number }> = [
    { value: 'open', label: 'New', description: 'Awaiting triage', count: groupedFlags.open.length },
    { value: 'reviewing', label: 'Needs context', description: 'Awaiting more detail', count: groupedFlags.reviewing.length },
    { value: 'actioned', label: 'Actioned', description: 'Resolved or rejected', count: groupedFlags.actioned.length },
  ];

  if (!flags.length) {
    return <p className="text-sm text-muted">No active flags 🎉</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabOptions.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isActive
                  ? 'border-brand/60 bg-brand/10 text-brand'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-semibold">{tab.label}</span>
              <Badge variant="secondary" className="bg-transparent text-xs text-muted">
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {filteredFlags.length ? (
        <div className="space-y-4">
          {activeStatus !== 'actioned' && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={isPending}>
                  {visibleSelected.length === filteredFlags.length && filteredFlags.length
                    ? 'Clear selection'
                    : 'Select visible'}
                </Button>
                <span className="text-xs text-muted">{visibleSelected.length} selected</span>
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
                <Button size="sm" variant="secondary" onClick={() => handleAction('reviewing')} disabled={isPending}>
                  Mark needs context
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleAction('rejected')} disabled={isPending}>
                  Reject selected
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {filteredFlags.map((flag) => {
              const isChecked = selected.has(flag.id);
              return (
                <div
                  key={flag.id}
                  className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleFlag(flag.id)}
                        aria-label={`Select flag ${flag.id}`}
                        disabled={isPending || activeStatus === 'actioned'}
                      />
                      <div className="text-xs uppercase tracking-wide text-muted">
                        {flag.reason.replace('_', ' ')} • {flag.entity_type}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        {flag.status.replace('_', ' ')}
                      </Badge>
                      <time className="text-xs text-muted-subtle" dateTime={flag.created_at}>
                        {new Date(flag.created_at).toLocaleString('en-CA')}
                      </time>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-strong">
                    {flag.entity_type === 'idea' && (
                      <div>
                        <p className="font-semibold">{flag.idea?.title ?? 'Idea'}</p>
                        <p className="text-xs text-muted">Current status: {flag.idea?.status ?? 'unknown'}</p>
                      </div>
                    )}
                    {flag.entity_type === 'comment' && (
                      <div className="rounded bg-slate-100 p-2 text-sm dark:bg-slate-800">
                        {flag.comment?.body}
                      </div>
                    )}
                    {flag.details && <p className="text-xs text-muted">Reporter note: {flag.details}</p>}
                    <p className="text-xs text-muted-subtle">Reported by {flag.reporter?.display_name ?? 'Community member'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-muted shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          No items in this bucket right now.
        </p>
      )}
    </div>
  );
}
