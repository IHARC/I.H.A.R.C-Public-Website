import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth } from '../_shared/auth.ts';
import { buildCorsHeaders, json } from '../_shared/http.ts';
import { createStripeClient } from '../_shared/stripe.ts';
import { requireIharcAdmin } from '../_shared/permissions.ts';

type Payload = { catalogItemId?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_admin_sync_catalog_item_stripe');
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

  const adminCheck = await requireIharcAdmin(serviceClient, auth.userId, 'donations_admin_sync_catalog_item_stripe');
  if (!adminCheck.ok) {
    return json(req, { error: adminCheck.error }, adminCheck.status);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'Invalid payload' }, 400);
  }

  const catalogItemId = typeof payload.catalogItemId === 'string' ? payload.catalogItemId.trim() : '';
  if (!catalogItemId) {
    return json(req, { error: 'catalogItemId is required' }, 422);
  }

  const { data: item, error: itemError } = await serviceClient
    .schema('donations')
    .from('catalog_items')
    .select('id, title, slug, currency, unit_cost_cents, stripe_product_id, stripe_price_id, is_active')
    .eq('id', catalogItemId)
    .maybeSingle();

  if (itemError || !item) {
    return json(req, { error: 'Catalog item not found' }, 404);
  }

  const unitCostCents = typeof item.unit_cost_cents === 'number' ? item.unit_cost_cents : null;
  if (!unitCostCents || unitCostCents <= 0) {
    return json(req, { error: 'Catalog item needs a unit cost before creating a Stripe price' }, 422);
  }

  const currency = typeof item.currency === 'string' ? item.currency.toLowerCase() : 'cad';
  const title = typeof item.title === 'string' ? item.title : 'Donation item';

  const { stripe } = await createStripeClient();

  let productId = typeof item.stripe_product_id === 'string' ? item.stripe_product_id : null;
  if (!productId) {
    const product = await stripe.products.create({
      name: title,
      description: 'Symbolic donation item for IHARC outreach.',
      metadata: { catalog_item_id: catalogItemId },
    });
    productId = product.id;

    const { error: updateError } = await serviceClient
      .schema('donations')
      .from('catalog_items')
      .update({ stripe_product_id: productId })
      .eq('id', catalogItemId);
    if (updateError) throw updateError;
  }

  const currentPriceId = typeof item.stripe_price_id === 'string' ? item.stripe_price_id : null;
  if (currentPriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(currentPriceId);
      if (
        typeof existingPrice.unit_amount === 'number' &&
        existingPrice.unit_amount === unitCostCents &&
        existingPrice.currency === currency
      ) {
        return json(req, { stripeProductId: productId, stripePriceId: currentPriceId }, 200);
      }

      await stripe.prices.update(currentPriceId, { active: false });
    } catch (error) {
      console.error('donations_admin_sync_catalog_item_stripe failed to reconcile existing price', error);
    }
  }

  const price = await stripe.prices.create({
    product: productId,
    currency,
    unit_amount: unitCostCents,
    metadata: { catalog_item_id: catalogItemId },
    nickname: title,
  });

  const { error: priceUpdateError } = await serviceClient
    .schema('donations')
    .from('catalog_items')
    .update({ stripe_price_id: price.id })
    .eq('id', catalogItemId);

  if (priceUpdateError) throw priceUpdateError;

  return json(req, { stripeProductId: productId, stripePriceId: price.id }, 200);
});
