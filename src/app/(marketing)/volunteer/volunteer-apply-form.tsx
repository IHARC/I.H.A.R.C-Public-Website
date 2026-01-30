"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_NOTE_LENGTH = 2000;

type Props = {
  roleId: string;
  organizationId: number;
  roleTitle: string;
};

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function VolunteerApplyForm({ roleId, organizationId, roleTitle }: Props) {
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const preferredContact = String(formData.get('preferred_contact') ?? '').trim();
    const availability = String(formData.get('availability') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim().slice(0, MAX_NOTE_LENGTH);
    const contactWindow = String(formData.get('contact_window') ?? '').trim();

    const consentContact = formData.get('consent_contact') === 'on';
    const consentTerms = formData.get('consent_terms') === 'on';

    const safeCall = formData.get('safe_call') === 'on';
    const safeText = formData.get('safe_text') === 'on';
    const safeVoicemail = formData.get('safe_voicemail') === 'on';

    if (!name) {
      setError('Please provide your name.');
      setState('error');
      return;
    }

    if (!email && !phone) {
      setError('Please share at least one contact method (email or phone).');
      setState('error');
      return;
    }

    if (!consentContact || !consentTerms) {
      setError('Please confirm the consent checkboxes before submitting.');
      setState('error');
      return;
    }

    const payload = {
      roleId,
      organizationId,
      name,
      email: email || null,
      phone: phone || null,
      preferredContact: preferredContact || null,
      availability: availability || null,
      notes: notes || null,
      contactWindow: contactWindow || null,
      consentContact,
      consentTerms,
      safeCall,
      safeText,
      safeVoicemail,
    };

    try {
      const response = await fetch('/api/volunteer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { error?: string; retryInMs?: number } | null;
      if (!response.ok) {
        const message = typeof result?.error === 'string' ? result.error : 'Unable to submit your application.';
        setError(message);
        setState('error');
        return;
      }

      form.reset();
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your application.');
      setState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-outline/20 bg-surface p-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-on-surface">Apply for {roleTitle}</h3>
        <p className="text-sm text-on-surface/70">
          Share your details and availability. IHARC staff will follow up through STEVI after reviewing your application.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="volunteer_name">Full name</Label>
          <Input id="volunteer_name" name="name" placeholder="Your name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volunteer_preferred_contact">Preferred contact</Label>
          <Input id="volunteer_preferred_contact" name="preferred_contact" placeholder="Email or phone" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="volunteer_email">Email</Label>
          <Input id="volunteer_email" name="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volunteer_phone">Phone</Label>
          <Input id="volunteer_phone" name="phone" type="tel" placeholder="(555) 555-5555" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="volunteer_contact_window">Best time to reach you</Label>
          <Input id="volunteer_contact_window" name="contact_window" placeholder="Weekday evenings" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Safe to contact by phone</Label>
          <div className="flex flex-wrap gap-3 text-sm text-on-surface/80">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="safe_call" className="h-4 w-4" />
              Call
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="safe_text" className="h-4 w-4" />
              Text
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="safe_voicemail" className="h-4 w-4" />
              Voicemail
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="volunteer_availability">Availability</Label>
        <Textarea
          id="volunteer_availability"
          name="availability"
          rows={3}
          placeholder="Share your weekly availability and any constraints."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="volunteer_notes">Additional notes</Label>
        <Textarea id="volunteer_notes" name="notes" rows={3} placeholder="Experience, interests, or anything else to share." />
      </div>

      <div className="space-y-2 rounded-2xl border border-outline/20 bg-white/60 p-4 text-sm text-on-surface/80">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="consent_contact" required className="mt-1 h-4 w-4" />
          <span>IHARC can contact me about this volunteer opportunity.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="consent_terms" required className="mt-1 h-4 w-4" />
          <span>I understand IHARC will review my application and follow up through STEVI.</span>
        </label>
      </div>

      {state === 'success' ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Application submitted. Thank you for stepping up—our team will be in touch soon.
        </p>
      ) : null}

      {state === 'error' && error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}

      <Button type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
