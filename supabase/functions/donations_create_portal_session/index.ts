import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type Payload = { token?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_create_portal_session');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

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

  const token = typeof payload.token === 'string' ? payload.token.trim() : '';
  if (!token || token.length < 16) {
    return json(req, { error: 'Invalid token' }, 422);
  }

  const tokenHash = await sha256Hex(token);

  const { data: tokenRow, error: tokenError } = await supabase
    .schema('donations')
    .from('donor_manage_tokens')
    .select('id, donor_id, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenError) {
    console.error('donations_create_portal_session token lookup error', tokenError);
    return json(req, { error: 'Invalid token' }, 422);
  }

  if (!tokenRow?.id || tokenRow.consumed_at) {
    return json(req, { error: 'Invalid token' }, 422);
  }

  const expiresAt = new Date(String(tokenRow.expires_at ?? ''));
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return json(req, { error: 'Token expired' }, 422);
  }

  const { data: donor, error: donorError } = await supabase
    .schema('donations')
    .from('donors')
    .select('id, stripe_customer_id')
    .eq('id', tokenRow.donor_id)
    .maybeSingle();

  if (donorError) {
    console.error('donations_create_portal_session donor lookup error', donorError);
    return json(req, { error: 'Unable to create portal session' }, 500);
  }

  const stripeCustomerId = typeof donor?.stripe_customer_id === 'string' ? donor.stripe_customer_id : null;
  if (!stripeCustomerId) {
    return json(req, { error: 'No active customer record' }, 422);
  }

  const siteOrigin = getSiteOrigin();
  const returnUrl = `${siteOrigin}/manage-donation`;

  const { stripe } = await createStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  const consumedAt = new Date().toISOString();
  const { data: consumedRow, error: consumeError } = await supabase
    .schema('donations')
    .from('donor_manage_tokens')
    .update({ consumed_at: consumedAt })
    .eq('id', tokenRow.id)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle();

  if (consumeError) {
    console.error('donations_create_portal_session failed to consume token', consumeError);
    return json(req, { error: 'Token already used' }, 422);
  }
  if (!consumedRow?.id) {
    return json(req, { error: 'Token already used' }, 422);
  }

  return json(req, { url: session.url }, 200);
});

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
