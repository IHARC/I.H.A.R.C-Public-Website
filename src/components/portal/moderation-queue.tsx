'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
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

  const handleAction = (flag: ModerationFlag, action: 'resolved' | 'rejected') => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/portal/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resolve_flag',
            flag_id: flag.id,
            status: action,
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Moderation failed');
        }
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
      {flags.map((flag) => (
        <div key={flag.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Flagged {flag.entity_type} • {flag.reason.replace('_', ' ')}
            </span>
            <time dateTime={flag.created_at}>{new Date(flag.created_at).toLocaleString('en-CA')}</time>
          </header>
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
          <div className="mt-4 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleAction(flag, 'resolved')}
              disabled={isPending}
              variant="outline"
            >
              Resolve
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction(flag, 'rejected')}
              disabled={isPending}
              variant="ghost"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
