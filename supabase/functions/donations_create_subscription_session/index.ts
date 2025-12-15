import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type Stripe from 'https://esm.sh/stripe@16?target=deno';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type StripeMode = 'test' | 'live';
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
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: buildCorsHeaders(req) });
    if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

    const siteOrigin = getSiteOrigin();

    const ipHash = await sha256Hex(readClientIp(req) ?? 'unknown');
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

    const payload = (await safeReadJson(req)) as Payload;
    const amountCents = normalizeWholeDollarCents(payload.monthlyAmountCents);
    if (amountCents === null) return json(req, { error: 'Monthly amount must be a whole dollar amount' }, 422);
    if (amountCents < MIN_MONTHLY_CENTS || amountCents > MAX_MONTHLY_CENTS) {
      return json(req, { error: 'Monthly amount is out of range' }, 422);
    }

    const { stripe, config } = await createStripeClient();
    const stripeMode: StripeMode = config.mode;

    const monthlyProductId = await ensureStripeProduct(stripe, stripeMode, {
      key: 'monthly_donation',
      name: 'Monthly donation',
      description: 'A monthly donation to support IHARC outreach.',
    });

    const priceId = await ensureRecurringPrice(stripe, stripeMode, {
      productId: monthlyProductId,
      currency: 'CAD',
      amountCents,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteOrigin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/donate/cancel`,
      metadata: { donation_type: 'monthly', amount_cents: String(amountCents), currency: 'CAD' },
      subscription_data: { metadata: { donation_type: 'monthly', amount_cents: String(amountCents), currency: 'CAD' } },
    });

    return json(req, { url: session.url }, 200);
  } catch (error) {
    const details = toPublicErrorDetails(error);
    console.error('donations_create_subscription_session unhandled error', details.logMessage);
    return json(req, { error: details.publicMessage }, details.status);
  }
});

function toPublicErrorDetails(error: unknown): { status: number; publicMessage: string; logMessage: string } {
  const anyError = error as { message?: unknown; statusCode?: unknown; type?: unknown; code?: unknown; requestId?: unknown };
  const rawMessage = typeof anyError?.message === 'string' ? anyError.message : '';

  const statusCode = typeof anyError?.statusCode === 'number' ? anyError.statusCode : null;
  const status = statusCode && statusCode >= 400 && statusCode <= 599 ? statusCode : 502;

  const type = typeof anyError?.type === 'string' ? anyError.type : null;
  const code = typeof anyError?.code === 'string' ? anyError.code : null;
  const requestId = typeof anyError?.requestId === 'string' ? anyError.requestId : null;
  const suffix = [type ? `type=${type}` : null, code ? `code=${code}` : null, requestId ? `requestId=${requestId}` : null]
    .filter(Boolean)
    .join(' ');

  return {
    status,
    publicMessage: rawMessage ? `${rawMessage}${suffix ? ` (${suffix})` : ''}` : 'Unable to start checkout',
    logMessage: error instanceof Error ? `${error.name}: ${error.message}` : rawMessage ? rawMessage : JSON.stringify(error),
  };
}

async function safeReadJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch (error) {
    console.error('donations_create_subscription_session invalid JSON', error);
    throw Object.assign(new Error('Invalid JSON payload'), { statusCode: 400 });
  }
}

function normalizeWholeDollarCents(value: unknown): number | null {
  const raw = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : NaN;
  if (!Number.isFinite(raw)) return null;
  const cents = Math.round(raw);
  if (cents % 100 !== 0) return null;
  return cents;
}

function isUniqueViolation(error: unknown): boolean {
  const anyError = error as { code?: unknown; message?: unknown };
  if (anyError?.code === '23505') return true;
  const message = typeof anyError?.message === 'string' ? anyError.message.toLowerCase() : '';
  return message.includes('duplicate');
}

async function ensureStripeProduct(
  stripe: Stripe,
  stripeMode: StripeMode,
  args: { key: string; name: string; description: string },
): Promise<string> {
  const { data, error } = await supabase
    .schema('donations')
    .from('stripe_products')
    .select('stripe_product_id')
    .eq('stripe_mode', stripeMode)
    .eq('key', args.key)
    .maybeSingle();
  if (error) {
    console.error('donations_create_subscription_session failed to load stripe product mapping', error);
    throw error;
  }
  if (data?.stripe_product_id) return data.stripe_product_id as string;

  const product = await stripe.products.create(
    { name: args.name, description: args.description },
    { idempotencyKey: `donations_${stripeMode}_product_${args.key}` },
  );

  const { error: insertError } = await supabase
    .schema('donations')
    .from('stripe_products')
    .insert({ stripe_mode: stripeMode, key: args.key, stripe_product_id: product.id });
  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: existing, error: existingError } = await supabase
        .schema('donations')
        .from('stripe_products')
        .select('stripe_product_id')
        .eq('stripe_mode', stripeMode)
        .eq('key', args.key)
        .maybeSingle();
      if (existingError) throw existingError;
      const existingId = typeof existing?.stripe_product_id === 'string' ? existing.stripe_product_id : null;
      if (existingId) return existingId;
    }
    console.error('donations_create_subscription_session failed to persist stripe product mapping', insertError);
    throw insertError;
  }

  return product.id;
}

async function ensureRecurringPrice(
  stripe: Stripe,
  stripeMode: StripeMode,
  args: { currency: string; amountCents: number; productId: string },
): Promise<string> {
  const currency = args.currency.toUpperCase();

  const { data, error } = await supabase
    .schema('donations')
    .from('stripe_amount_prices')
    .select('stripe_price_id')
    .eq('stripe_mode', stripeMode)
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
    { idempotencyKey: `donations_${stripeMode}_price_month_${currency}_${args.amountCents}` },
  );

  const { error: insertError } = await supabase
    .schema('donations')
    .from('stripe_amount_prices')
    .insert({ stripe_mode: stripeMode, currency, interval: 'month', amount_cents: args.amountCents, stripe_price_id: price.id });
  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: existing, error: existingError } = await supabase
        .schema('donations')
        .from('stripe_amount_prices')
        .select('stripe_price_id')
        .eq('stripe_mode', stripeMode)
        .eq('currency', currency)
        .eq('interval', 'month')
        .eq('amount_cents', args.amountCents)
        .maybeSingle();
      if (existingError) throw existingError;
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
