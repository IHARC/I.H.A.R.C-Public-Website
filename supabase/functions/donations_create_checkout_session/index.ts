import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16?target=deno';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';

type StripeMode = 'test' | 'live';
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
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: buildCorsHeaders(req) });
    if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

    const siteOrigin = getSiteOrigin();

    const ipHash = await sha256Hex(readClientIp(req) ?? 'unknown');
    const rl = await supabase.schema('donations').rpc('donations_check_rate_limit', {
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

    const payload = (await safeReadJson(req)) as Payload;

    const customAmountCentsRaw =
      typeof payload.customAmountCents === 'number'
        ? Math.round(payload.customAmountCents)
        : typeof payload.customAmountCents === 'string'
          ? Math.round(Number.parseFloat(payload.customAmountCents))
          : 0;
    if (!Number.isFinite(customAmountCentsRaw) || customAmountCentsRaw < 0) return json(req, { error: 'Invalid custom amount' }, 422);

    const customAmountCents =
      customAmountCentsRaw === 0
        ? 0
        : customAmountCentsRaw < CUSTOM_AMOUNT_MIN_CENTS || customAmountCentsRaw > CUSTOM_AMOUNT_MAX_CENTS
          ? null
          : customAmountCentsRaw;
    if (customAmountCents === null) return json(req, { error: 'Custom amount is out of range' }, 422);

    const normalizedLines = normalizeLineItems(payload.items);
    if (normalizedLines.length > MAX_LINE_ITEMS) return json(req, { error: 'Too many line items' }, 422);
    if (normalizedLines.length === 0 && customAmountCents === 0) return json(req, { error: 'Add items or a custom amount' }, 422);

    const { stripe, config } = await createStripeClient();
    const stripeMode: StripeMode = config.mode;

    const { intentItems, stripeLineItems, currency, itemsTotalCents } = await buildStripeLineItems(normalizedLines);
    const fullTotalAmountCents = itemsTotalCents + customAmountCents;

    if (customAmountCents > 0) {
      const customDonationProductId = await ensureStripeProduct(stripe, stripeMode, {
        key: 'custom_donation',
        name: 'Custom donation',
        description: 'A custom donation to support IHARC outreach.',
      });

      stripeLineItems.push({
        price_data: { currency: currency.toLowerCase(), unit_amount: customAmountCents, product: customDonationProductId },
        quantity: 1,
      });
    }

    const { data: intentRow, error: intentError } = await supabase
      .schema('donations')
      .from('donation_intents')
      .insert({
        status: 'pending',
        total_amount_cents: fullTotalAmountCents,
        currency,
        custom_amount_cents: customAmountCents,
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
      const { error: itemsError } = await supabase
        .schema('donations')
        .from('donation_intent_items')
        .insert(intentItems.map((item) => ({ donation_intent_id: intentRow.id, ...item })));
      if (itemsError) {
        console.error('donations_create_checkout_session failed to create intent items', itemsError);
        return json(req, { error: 'Unable to start checkout' }, 500);
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        submit_type: 'donate',
        billing_address_collection: 'required',
        customer_creation: 'always',
        line_items: stripeLineItems,
        success_url: `${siteOrigin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteOrigin}/donate/cancel`,
        client_reference_id: intentRow.id,
        metadata: { donation_intent_id: intentRow.id },
        payment_intent_data: { metadata: { donation_intent_id: intentRow.id } },
      },
      { idempotencyKey: `donations_checkout_session_${intentRow.id}` },
    );

    await supabase
      .schema('donations')
      .from('donation_intents')
      .update({ stripe_session_id: session.id, status: 'requires_payment' })
      .eq('id', intentRow.id);

    return json(req, { url: session.url }, 200);
  } catch (error) {
    const details = toPublicErrorDetails(error);
    console.error('donations_create_checkout_session unhandled error', details.logMessage);
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
    console.error('donations_create_checkout_session invalid JSON', error);
    throw Object.assign(new Error('Invalid JSON payload'), { statusCode: 400 });
  }
}

function normalizeLineItems(items: unknown): { catalogItemId: string; quantity: number }[] {
  const input = Array.isArray(items) ? (items as CheckoutLineInput[]) : [];
  const normalized: { catalogItemId: string; quantity: number }[] = [];
  for (const line of input) {
    const catalogItemId = typeof line.catalogItemId === 'string' ? line.catalogItemId.trim() : '';
    const quantityRaw = typeof line.quantity === 'number' ? line.quantity : Number.parseInt(String(line.quantity ?? ''), 10);
    const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : 0;
    if (!catalogItemId || quantity <= 0) continue;
    normalized.push({ catalogItemId, quantity: Math.min(MAX_QTY_PER_ITEM, quantity) });
  }
  return normalized;
}

async function buildStripeLineItems(lines: { catalogItemId: string; quantity: number }[]) {
  const catalogIds = Array.from(new Set(lines.map((line) => line.catalogItemId)));
  const { data: catalogRows, error: catalogError } = catalogIds.length
    ? await supabase
        .schema('donations')
        .from('catalog_items')
        .select('id, title, currency, unit_cost_cents, stripe_price_id, is_active')
        .in('id', catalogIds)
    : { data: [], error: null };
  if (catalogError) throw catalogError;

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of (catalogRows ?? []) as Record<string, unknown>[]) {
    if (typeof row.id === 'string') byId.set(row.id, row);
  }

  const intentItems: { catalog_item_id: string; quantity: number; unit_amount_cents: number; line_amount_cents: number }[] = [];
  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  let currency = 'CAD';
  let currencyLocked = false;
  let itemsTotalCents = 0;

  for (const line of lines) {
    const row = byId.get(line.catalogItemId);
    if (!row || row.is_active === false) throw Object.assign(new Error('One or more items are unavailable'), { statusCode: 422 });

    const stripePriceId = typeof row.stripe_price_id === 'string' ? row.stripe_price_id : null;
    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      throw Object.assign(new Error('One or more items are not ready for checkout yet'), { statusCode: 422 });
    }

    const unitCost = typeof row.unit_cost_cents === 'number' ? row.unit_cost_cents : null;
    if (unitCost === null || unitCost < 0) throw Object.assign(new Error('One or more items are missing an amount'), { statusCode: 422 });

    const rowCurrency = typeof row.currency === 'string' ? row.currency : null;
    if (!rowCurrency) throw Object.assign(new Error('One or more items are missing currency'), { statusCode: 422 });

    if (!currencyLocked) {
      currency = rowCurrency;
      currencyLocked = true;
    } else if (currency !== rowCurrency) {
      throw Object.assign(new Error('Items must share a single currency'), { statusCode: 422 });
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

  return { intentItems, stripeLineItems, currency, itemsTotalCents };
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
  if (error) throw error;
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
    throw insertError;
  }

  return product.id;
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
