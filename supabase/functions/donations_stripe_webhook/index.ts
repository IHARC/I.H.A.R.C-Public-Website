import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type Stripe from 'https://esm.sh/stripe@16?target=deno';
import { buildCorsHeaders, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';
import { processStripeEvent } from '../_shared/donations-webhook.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_stripe_webhook');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function isUniqueViolation(error: unknown): boolean {
  const anyError = error as { code?: unknown; message?: unknown };
  if (anyError?.code === '23505') return true;
  const message = typeof anyError?.message === 'string' ? anyError.message.toLowerCase() : '';
  return message.includes('duplicate');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return json(req, { error: 'Missing Stripe signature' }, 400);
  }

  const { stripe, config } = await createStripeClient();

  const rawBody = new Uint8Array(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.webhookSecret);
  } catch (error) {
    console.error('donations_stripe_webhook invalid signature', error);
    return json(req, { error: 'Invalid signature' }, 400);
  }

  const stripeEventId = event.id;
  const stripeType = event.type;

  let existingStatus: string | null = null;
  const { error: insertError } = await supabase
    .schema('donations')
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: stripeEventId,
      type: stripeType,
      received_at: new Date().toISOString(),
    });

  if (insertError) {
    if (!isUniqueViolation(insertError)) {
      console.error('donations_stripe_webhook failed to insert event row', insertError);
      return json(req, { error: 'Unable to process event' }, 500);
    }

    const { data: existing, error: existingError } = await supabase
      .schema('donations')
      .from('stripe_webhook_events')
      .select('status')
      .eq('stripe_event_id', stripeEventId)
      .maybeSingle();

    if (existingError) {
      console.error('donations_stripe_webhook failed to load existing event row', existingError);
      return json(req, { error: 'Unable to process event' }, 500);
    }

    existingStatus = typeof existing?.status === 'string' ? existing.status : null;
    if (existingStatus === 'succeeded') {
      return json(req, { ok: true }, 200);
    }
  }

  try {
    await processStripeEvent({ stripe, supabase, event });
    await supabase
      .schema('donations')
      .from('stripe_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        status: 'succeeded',
        error: null,
      })
      .eq('stripe_event_id', stripeEventId);
  } catch (error) {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? `${error.name}: ${error.message}`
          : JSON.stringify(error);

    console.error('donations_stripe_webhook processing error', message);

    await supabase
      .schema('donations')
      .from('stripe_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        status: 'failed',
        error: message.slice(0, 5000),
      })
      .eq('stripe_event_id', stripeEventId);

    // Return a non-2xx so Stripe can retry deliveries. Duplicate deliveries are
    // handled via the events table + idempotent inserts in the processing layer.
    return json(req, { error: 'Processing failed' }, 500);
  }

  return json(req, { ok: true }, 200);
});
