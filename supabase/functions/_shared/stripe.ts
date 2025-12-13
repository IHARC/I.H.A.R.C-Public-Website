import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16?target=deno';
import { requireEnv } from './env.ts';

export type StripeConfig = {
  mode: 'test' | 'live';
  secretKey: string;
  webhookSecret: string;
};

type StripeConfigRow = {
  stripe_mode?: unknown;
  stripe_secret_key?: unknown;
  stripe_webhook_secret?: unknown;
};

export function createServiceClient() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function loadStripeConfig() : Promise<StripeConfig> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.schema('donations').rpc('donations_get_stripe_config');
  if (error) {
    throw new Error(error.message || 'Unable to load Stripe configuration');
  }

  const row = (Array.isArray(data) ? (data[0] as StripeConfigRow | undefined) : null) ?? null;
  const mode = row?.stripe_mode;
  const secretKey = row?.stripe_secret_key;
  const webhookSecret = row?.stripe_webhook_secret;

  if (mode !== 'test' && mode !== 'live') {
    throw new Error('Stripe mode is not configured');
  }
  if (typeof secretKey !== 'string' || !secretKey) {
    throw new Error('Stripe secret key is not configured');
  }
  if (typeof webhookSecret !== 'string' || !webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  return { mode, secretKey, webhookSecret };
}

export async function createStripeClient(): Promise<{ stripe: Stripe; config: StripeConfig }> {
  const config = await loadStripeConfig();
  const stripe = new Stripe(config.secretKey, { apiVersion: '2024-06-20' });
  return { stripe, config };
}
