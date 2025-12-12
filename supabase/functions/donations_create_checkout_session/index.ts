import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16?target=deno';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type CheckoutLineInput = { catalogItemId?: unknown; quantity?: unknown };
type Payload = { items?: unknown; customAmountCents?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_create_checkout_session');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const MAX_LINE_ITEMS = 25;
const MAX_QTY_PER_ITEM = 25;
const CUSTOM_AMOUNT_MIN_CENTS = 100;
const CUSTOM_AMOUNT_MAX_CENTS = 500_000;

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

  const rl = await supabase.rpc('donations_check_rate_limit', {
    p_event: 'donations:create_checkout_session:ip',
    p_identifier: ipHash,
    p_limit: 10,
    p_window_ms: 10 * 60 * 1000,
    p_cooldown_ms: 2_000,
  });

  if (rl.error) {
    console.error('donations_create_checkout_session rate limit error', rl.error);
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
    console.error('donations_create_checkout_session invalid JSON', error);
    return json(req, { error: 'Invalid JSON payload' }, 400);
  }

  const itemsInput = Array.isArray(payload.items) ? (payload.items as CheckoutLineInput[]) : [];
  const customAmountCents =
    typeof payload.customAmountCents === 'number'
      ? Math.round(payload.customAmountCents)
      : typeof payload.customAmountCents === 'string'
        ? Math.round(Number.parseFloat(payload.customAmountCents))
        : 0;

  if (!Number.isFinite(customAmountCents) || customAmountCents < 0) {
    return json(req, { error: 'Invalid custom amount' }, 422);
  }

  const normalizedCustomAmountCents =
    customAmountCents === 0
      ? 0
      : customAmountCents < CUSTOM_AMOUNT_MIN_CENTS || customAmountCents > CUSTOM_AMOUNT_MAX_CENTS
        ? null
        : customAmountCents;

  if (normalizedCustomAmountCents === null) {
    return json(req, { error: 'Custom amount is out of range' }, 422);
  }

  const normalizedLines: { catalogItemId: string; quantity: number }[] = [];
  for (const line of itemsInput) {
    const catalogItemId = typeof line.catalogItemId === 'string' ? line.catalogItemId : '';
    const quantityRaw = typeof line.quantity === 'number' ? line.quantity : Number.parseInt(String(line.quantity ?? ''), 10);
    const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : 0;
    if (!catalogItemId || quantity <= 0) continue;
    normalizedLines.push({ catalogItemId, quantity: Math.min(MAX_QTY_PER_ITEM, quantity) });
  }

  if (normalizedLines.length > MAX_LINE_ITEMS) {
    return json(req, { error: 'Too many line items' }, 422);
  }

  if (normalizedLines.length === 0 && normalizedCustomAmountCents === 0) {
    return json(req, { error: 'Add items or a custom amount' }, 422);
  }

  const catalogIds = Array.from(new Set(normalizedLines.map((line) => line.catalogItemId)));
  const { data: catalogRows, error: catalogError } = catalogIds.length
    ? await supabase
        .schema('donations')
        .from('catalog_items')
        .select('id, title, currency, unit_cost_cents, stripe_price_id, is_active')
        .in('id', catalogIds)
    : { data: [], error: null };

  if (catalogError) {
    console.error('donations_create_checkout_session catalog load error', catalogError);
    return json(req, { error: 'Unable to load catalog items' }, 500);
  }

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of (catalogRows ?? []) as Record<string, unknown>[]) {
    if (typeof row.id === 'string') byId.set(row.id, row);
  }

  const intentItems: {
    catalog_item_id: string;
    quantity: number;
    unit_amount_cents: number;
    line_amount_cents: number;
  }[] = [];

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let currency = 'CAD';
  let currencyLocked = false;
  let itemsTotalCents = 0;

  for (const line of normalizedLines) {
    const row = byId.get(line.catalogItemId);
    if (!row) {
      return json(req, { error: 'One or more items are unavailable' }, 422);
    }
    if (row.is_active === false) {
      return json(req, { error: 'One or more items are currently unavailable' }, 422);
    }
    const stripePriceId = typeof row.stripe_price_id === 'string' ? row.stripe_price_id : null;
    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      return json(req, { error: 'One or more items are not ready for checkout yet' }, 422);
    }
    const unitCost = typeof row.unit_cost_cents === 'number' ? row.unit_cost_cents : null;
    if (!unitCost || unitCost < 0) {
      return json(req, { error: 'One or more items are missing an amount' }, 422);
    }
    const rowCurrency = typeof row.currency === 'string' ? row.currency : null;
    if (!rowCurrency) {
      return json(req, { error: 'One or more items are missing currency' }, 422);
    }
    if (!currencyLocked) {
      currency = rowCurrency;
      currencyLocked = true;
    } else if (currency !== rowCurrency) {
      return json(req, { error: 'Items must share a single currency' }, 422);
    }
    const lineAmount = unitCost * line.quantity;
    itemsTotalCents += lineAmount;

    intentItems.push({
      catalog_item_id: line.catalogItemId,
      quantity: line.quantity,
      unit_amount_cents: unitCost,
      line_amount_cents: lineAmount,
    });

    stripeLineItems.push({ price: stripePriceId, quantity: line.quantity });
  }

  const totalAmountCents = itemsTotalCents + normalizedCustomAmountCents;

  const { stripe } = await createStripeClient();

  if (normalizedCustomAmountCents > 0) {
    const customDonationProductId = await ensureStripeProduct(stripe, {
      key: 'custom_donation',
      name: 'Custom donation',
      description: 'A custom donation to support IHARC outreach.',
    });

    stripeLineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: normalizedCustomAmountCents,
        product: customDonationProductId,
      },
      quantity: 1,
    });
  }

  const { data: intentRow, error: intentError } = await supabase
    .schema('donations')
    .from('donation_intents')
    .insert({
      status: 'pending',
      total_amount_cents: totalAmountCents,
      currency,
      custom_amount_cents: normalizedCustomAmountCents,
      metadata: {
        source: 'iharc.ca',
        ip_hash: ipHash,
        ua: req.headers.get('user-agent') ?? null,
      },
    })
    .select('id')
    .single();

  if (intentError || !intentRow?.id) {
    console.error('donations_create_checkout_session failed to create intent', intentError);
    return json(req, { error: 'Unable to start checkout' }, 500);
  }

  if (intentItems.length) {
    const { error: itemsError } = await supabase.schema('donations').from('donation_intent_items').insert(
      intentItems.map((item) => ({
        donation_intent_id: intentRow.id,
        ...item,
      })),
    );
    if (itemsError) {
      console.error('donations_create_checkout_session failed to create intent items', itemsError);
      return json(req, { error: 'Unable to start checkout' }, 500);
    }
  }

  const successUrl = `${siteOrigin}/donate/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteOrigin}/donate/cancel`;

  const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      billing_address_collection: 'required',
      customer_creation: 'always',
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: intentRow.id,
      metadata: {
        donation_intent_id: intentRow.id,
      },
      payment_intent_data: {
        metadata: { donation_intent_id: intentRow.id },
      },
  }, { idempotencyKey: `donations_checkout_session_${intentRow.id}` });

  await supabase
    .schema('donations')
    .from('donation_intents')
    .update({ stripe_session_id: session.id, status: 'requires_payment' })
    .eq('id', intentRow.id);

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
    console.error('donations_create_checkout_session failed to load stripe product mapping', error);
    throw error;
  }
  if (data?.stripe_product_id) return data.stripe_product_id as string;

  const product = await stripe.products.create(
    {
      name: args.name,
      description: args.description,
    },
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
        console.error('donations_create_checkout_session failed to reload stripe product mapping', existingError);
        throw existingError;
      }

      const existingId = typeof existing?.stripe_product_id === 'string' ? existing.stripe_product_id : null;
      if (existingId) return existingId;
    }

    console.error('donations_create_checkout_session failed to persist stripe product mapping', insertError);
    throw insertError;
  }

  return product.id;
}

function readClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }
  return req.headers.get('x-real-ip');
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
