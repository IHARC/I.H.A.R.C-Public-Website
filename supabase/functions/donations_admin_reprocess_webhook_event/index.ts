import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth } from '../_shared/auth.ts';
import { buildCorsHeaders, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';
import { processStripeEvent } from '../_shared/donations-webhook.ts';
import { requireIharcAdmin } from '../_shared/permissions.ts';

type Payload = { stripeEventId?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_admin_reprocess_webhook_event');
}

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return json(req, { error: auth.error }, 401);
  }

  const adminCheck = await requireIharcAdmin(serviceClient, auth.userId, 'donations_admin_reprocess_webhook_event');
  if (!adminCheck.ok) {
    return json(req, { error: adminCheck.error }, adminCheck.status);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'Invalid payload' }, 400);
  }

  const stripeEventId = typeof payload.stripeEventId === 'string' ? payload.stripeEventId.trim() : '';
  if (!stripeEventId || !stripeEventId.startsWith('evt_')) {
    return json(req, { error: 'Invalid stripeEventId' }, 422);
  }

  const { data: existing, error: existingError } = await serviceClient
    .schema('donations')
    .from('stripe_webhook_events')
    .select('stripe_event_id, status')
    .eq('stripe_event_id', stripeEventId)
    .maybeSingle();

  if (existingError || !existing) {
    return json(req, { error: 'Webhook event not found' }, 404);
  }

  if (existing.status !== 'failed') {
    return json(req, { error: 'Only failed events can be reprocessed' }, 422);
  }

  const { stripe } = await createStripeClient();
  const event = await stripe.events.retrieve(stripeEventId);

  try {
    await processStripeEvent({ stripe, supabase: serviceClient, event });
    await serviceClient
      .schema('donations')
      .from('stripe_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        status: 'succeeded',
        error: null,
      })
      .eq('stripe_event_id', stripeEventId);

    return json(req, { ok: true }, 200);
  } catch (error) {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? `${error.name}: ${error.message}`
          : JSON.stringify(error);

    await serviceClient
      .schema('donations')
      .from('stripe_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        status: 'failed',
        error: message.slice(0, 5000),
      })
      .eq('stripe_event_id', stripeEventId);

    return json(req, { error: 'Reprocess failed' }, 500);
  }
});
