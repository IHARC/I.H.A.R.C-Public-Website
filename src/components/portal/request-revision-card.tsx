'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export function RequestRevisionCard({ ideaId }: { ideaId: string }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!message.trim()) {
      toast({ title: 'Add revision guidance', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/portal/ideas/${ideaId}/request-revision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message.trim() }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Request failed');
        }
        toast({ title: 'Revision requested', description: 'The idea owner has been notified.' });
        setMessage('');
      } catch (error) {
        toast({
          title: 'Unable to request revision',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Request revisions</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Send the idea owner a note outlining what to update.</p>
      </div>
      <Textarea
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Explain what needs clarification or updates."
      />
      <Button size="sm" onClick={handleSubmit} disabled={pending}>
        {pending ? 'Sending…' : 'Send request'}
      </Button>
    </div>
  );
}
