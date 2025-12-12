import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type Payload = { sessionId?: unknown };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'Invalid payload' }, 400);
  }

  const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return json(req, { error: 'Invalid session id' }, 422);
  }

  try {
    const { stripe } = await createStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const mode = session.mode === 'subscription' ? 'subscription' : 'payment';
    const paymentStatus =
      session.payment_status === 'paid' || session.payment_status === 'unpaid' || session.payment_status === 'no_payment_required'
        ? session.payment_status
        : 'unknown';

    return json(req, {
      mode,
      paymentStatus,
      amountTotalCents: typeof session.amount_total === 'number' ? session.amount_total : null,
      currency: typeof session.currency === 'string' ? session.currency.toUpperCase() : null,
    });
  } catch (error) {
    console.error('donations_get_checkout_status stripe retrieve error', error);
    return json(req, { error: 'Unable to confirm donation status' }, 502);
  }
});
