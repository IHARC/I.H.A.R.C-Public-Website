"use client";

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';

export function ManageDonationClient() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<{ loading: boolean; done: boolean; error: string | null }>({
    loading: false,
    done: false,
    error: null,
  });

  async function requestLink() {
    setState({ loading: true, done: false, error: null });
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized || !normalized.includes('@')) {
        throw new Error('Enter a valid email address.');
      }
      const supabase = getSupabasePublicClient();
      const response = await supabase.functions.invoke('donations_request_manage_link', {
        body: { email: normalized },
      });
      if (response.error) {
        throw new Error(response.error.message || 'Unable to request a manage link.');
      }
      setState({ loading: false, done: true, error: null });
    } catch (error) {
      setState({
        loading: false,
        done: false,
        error: error instanceof Error ? error.message : 'Unable to request a manage link.',
      });
    }
  }

  return (
    <Card className="border-outline-variant bg-surface-container-high">
      <CardHeader className="space-y-2">
        <CardTitle>Send me a secure link</CardTitle>
        <CardDescription>
          We’ll email a time-limited link to Stripe’s Customer Portal. For privacy, we don’t confirm whether a donation
          exists.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manage-email">Email</Label>
          <Input
            id="manage-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={state.loading || state.done}
          />
        </div>

        <Button type="button" className="gap-2" disabled={state.loading || state.done} onClick={requestLink}>
          {state.loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden />
              Email my manage link
            </>
          )}
        </Button>

        {state.done ? (
          <div className="rounded-lg border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
            If we found an active monthly donation for that email, a link is on its way. Check your inbox (and spam
            folder) in the next few minutes.
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-on-surface">
            {state.error}
          </div>
        ) : null}

        <p className="text-xs text-on-surface-variant">
          Having trouble? Email{' '}
          <a href="mailto:donations@iharc.ca" className="font-semibold text-primary underline">
            donations@iharc.ca
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}

