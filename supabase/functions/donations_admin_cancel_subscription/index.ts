import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type Payload = { stripeSubscriptionId?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_admin_cancel_subscription');
}

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!accessToken) {
    return json(req, { error: 'Missing bearer token' }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: isAdmin, error: adminError } = await userClient.rpc('check_iharc_admin_role');
  if (adminError) {
    console.error('donations_admin_cancel_subscription admin check error', adminError);
    return json(req, { error: 'Unauthorized' }, 403);
  }
  if (isAdmin !== true) {
    return json(req, { error: 'Insufficient permissions' }, 403);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'Invalid payload' }, 400);
  }

  const stripeSubscriptionId = typeof payload.stripeSubscriptionId === 'string' ? payload.stripeSubscriptionId.trim() : '';
  if (!stripeSubscriptionId || !stripeSubscriptionId.startsWith('sub_')) {
    return json(req, { error: 'Invalid stripeSubscriptionId' }, 422);
  }

  const { stripe } = await createStripeClient();
  const canceled = await stripe.subscriptions.cancel(stripeSubscriptionId);

  await serviceClient
    .schema('donations')
    .from('donation_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: canceled.canceled_at ? new Date(canceled.canceled_at * 1000).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId);

  return json(req, { ok: true }, 200);
});
