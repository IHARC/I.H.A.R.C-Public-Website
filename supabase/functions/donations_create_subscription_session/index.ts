import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type Stripe from 'https://esm.sh/stripe@16?target=deno';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type Payload = { monthlyAmountCents?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_create_subscription_session');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const MIN_MONTHLY_CENTS = 500;
const MAX_MONTHLY_CENTS = 500_000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  const siteOrigin = getSiteOrigin();

  const ip = readClientIp(req);
  const ipHash = await sha256Hex(ip ?? 'unknown');

  const rl = await supabase.schema('donations').rpc('donations_check_rate_limit', {
    p_event: 'donations:create_subscription_session:ip',
    p_identifier: ipHash,
    p_limit: 6,
    p_window_ms: 10 * 60 * 1000,
    p_cooldown_ms: 5_000,
  });
  if (rl.error) {
    console.error('donations_create_subscription_session rate limit error', rl.error);
    return json(req, { error: 'Unable to process request' }, 500);
  }

  const allowed = (rl.data as { allowed?: unknown }[] | null)?.[0]?.allowed;
  const retryInMs = (rl.data as { retry_in_ms?: unknown }[] | null)?.[0]?.retry_in_ms;
  if (allowed === false) {
    return json(req, { error: 'Too many requests', retryInMs: typeof retryInMs === 'number' ? retryInMs : 30_000 }, 429);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error('donations_create_subscription_session invalid JSON', error);
    return json(req, { error: 'Invalid JSON payload' }, 400);
  }

  const amountRaw =
    typeof payload.monthlyAmountCents === 'number'
      ? payload.monthlyAmountCents
      : typeof payload.monthlyAmountCents === 'string'
        ? Number.parseFloat(payload.monthlyAmountCents)
        : NaN;

  const amountCents = Math.round(amountRaw);
  if (!Number.isFinite(amountCents) || amountCents < MIN_MONTHLY_CENTS || amountCents > MAX_MONTHLY_CENTS) {
    return json(req, { error: 'Monthly amount is out of range' }, 422);
  }
  if (amountCents % 100 !== 0) {
    return json(req, { error: 'Monthly amount must be a whole dollar amount' }, 422);
  }

  const { stripe } = await createStripeClient();

  const monthlyProductId = await ensureStripeProduct(stripe, {
    key: 'monthly_donation',
    name: 'Monthly donation',
    description: 'A monthly donation to support IHARC outreach.',
  });

  const priceId = await ensureRecurringPrice(stripe, { amountCents, currency: 'CAD', productId: monthlyProductId });

  const successUrl = `${siteOrigin}/donate/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteOrigin}/donate/cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    billing_address_collection: 'required',
    customer_creation: 'always',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      donation_type: 'monthly',
      amount_cents: String(amountCents),
      currency: 'CAD',
    },
    subscription_data: {
      metadata: {
        donation_type: 'monthly',
        amount_cents: String(amountCents),
        currency: 'CAD',
      },
    },
  });

  return json(req, { url: session.url }, 200);
});

function isUniqueViolation(error: unknown): boolean {
  const anyError = error as { code?: unknown; message?: unknown };
  if (anyError?.code === '23505') return true;
  const message = typeof anyError?.message === 'string' ? anyError.message.toLowerCase() : '';
  return message.includes('duplicate');
}

async function ensureStripeProduct(stripe: Stripe, args: { key: string; name: string; description: string }) {
  const { data, error } = await supabase
    .schema('donations')
    .from('stripe_products')
    .select('stripe_product_id')
    .eq('key', args.key)
    .maybeSingle();

  if (error) {
    console.error('donations_create_subscription_session failed to load stripe product mapping', error);
    throw error;
  }
  if (data?.stripe_product_id) return data.stripe_product_id as string;

  const product = await stripe.products.create(
    { name: args.name, description: args.description },
    { idempotencyKey: `donations_product_${args.key}` },
  );

  const { error: insertError } = await supabase
    .schema('donations')
    .from('stripe_products')
    .insert({ key: args.key, stripe_product_id: product.id });

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: existing, error: existingError } = await supabase
        .schema('donations')
        .from('stripe_products')
        .select('stripe_product_id')
        .eq('key', args.key)
        .maybeSingle();

      if (existingError) {
        console.error('donations_create_subscription_session failed to reload stripe product mapping', existingError);
        throw existingError;
      }

      const existingId = typeof existing?.stripe_product_id === 'string' ? existing.stripe_product_id : null;
      if (existingId) return existingId;
    }

    console.error('donations_create_subscription_session failed to persist stripe product mapping', insertError);
    throw insertError;
  }

  return product.id;
}

async function ensureRecurringPrice(stripe: Stripe, args: { currency: string; amountCents: number; productId: string }) {
  const currency = args.currency.toUpperCase();

  const { data, error } = await supabase
    .schema('donations')
    .from('stripe_amount_prices')
    .select('stripe_price_id')
    .eq('currency', currency)
    .eq('interval', 'month')
    .eq('amount_cents', args.amountCents)
    .maybeSingle();

  if (error) {
    console.error('donations_create_subscription_session failed to load stripe amount price mapping', error);
    throw error;
  }
  if (data?.stripe_price_id) return data.stripe_price_id as string;

  const price = await stripe.prices.create(
    {
      currency: currency.toLowerCase(),
      unit_amount: args.amountCents,
      recurring: { interval: 'month' },
      product: args.productId,
      nickname: `Monthly donation ${currency} ${args.amountCents / 100}`,
    },
    { idempotencyKey: `donations_price_month_${currency}_${args.amountCents}` },
  );

  const { error: insertError } = await supabase
    .schema('donations')
    .from('stripe_amount_prices')
    .insert({
      currency,
      interval: 'month',
      amount_cents: args.amountCents,
      stripe_price_id: price.id,
    });

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: existing, error: existingError } = await supabase
        .schema('donations')
        .from('stripe_amount_prices')
        .select('stripe_price_id')
        .eq('currency', currency)
        .eq('interval', 'month')
        .eq('amount_cents', args.amountCents)
        .maybeSingle();

      if (existingError) {
        console.error('donations_create_subscription_session failed to reload stripe amount price mapping', existingError);
        throw existingError;
      }

      const existingId = typeof existing?.stripe_price_id === 'string' ? existing.stripe_price_id : null;
      if (existingId) return existingId;
    }

    console.error('donations_create_subscription_session failed to persist stripe amount price mapping', insertError);
    throw insertError;
  }

  return price.id;
}

function readClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return req.headers.get('x-real-ip');
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
