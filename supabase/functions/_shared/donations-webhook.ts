import type Stripe from 'https://esm.sh/stripe@16?target=deno';
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
import { requireEnv } from './env.ts';

type SupabaseServiceClient = any;

type ReceiptArgs = {
  recipientEmail: string;
  amountCents: number;
  currency: string;
  kind: 'one_time' | 'monthly';
  reference: string;
};

type DonorUpsertArgs = {
  email: string | null;
  name: string | null;
  address: unknown;
  stripeCustomerId: string | null;
};

function requireSmtp() {
  const from = requireEnv('PORTAL_EMAIL_FROM');
  const host = requireEnv('PORTAL_SMTP_HOST');
  const port = Number(requireEnv('PORTAL_SMTP_PORT'));
  const username = requireEnv('PORTAL_SMTP_USERNAME');
  const password = requireEnv('PORTAL_SMTP_PASSWORD');
  const secure = (requireEnv('PORTAL_SMTP_SECURE').toLowerCase() === 'true');

  return { from, host, port, username, password, secure };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isUniqueViolation(error: unknown): boolean {
  const anyError = error as { code?: unknown; message?: unknown };
  if (anyError?.code === '23505') return true;
  const message = typeof anyError?.message === 'string' ? anyError.message.toLowerCase() : '';
  return message.includes('duplicate');
}

export async function processStripeEvent(args: { stripe: Stripe; supabase: SupabaseServiceClient; event: Stripe.Event }) {
  switch (args.event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(args, args.event.data.object as Stripe.Checkout.Session);
      return;
    case 'invoice.paid':
      await handleInvoicePaid(args, args.event.data.object as Stripe.Invoice);
      return;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(args, args.event.data.object as Stripe.Invoice);
      return;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionUpdated(args, args.event.data.object as Stripe.Subscription);
      return;
    case 'charge.refunded':
      await handleChargeRefunded(args, args.event.data.object as Stripe.Charge);
      return;
    default:
      return;
  }
}

async function handleCheckoutSessionCompleted(
  { stripe, supabase }: { stripe: Stripe; supabase: SupabaseServiceClient },
  session: Stripe.Checkout.Session,
) {
  const mode = session.mode;
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const details = session.customer_details;
  const email = typeof details?.email === 'string' ? details.email.trim().toLowerCase() : null;
  const name = typeof details?.name === 'string' ? details.name.trim() : null;
  const address = details?.address ?? null;

  const donorId = await upsertDonor(supabase, {
    email,
    name,
    address,
    stripeCustomerId: customerId,
  });

  if (mode === 'payment') {
    const intentId = typeof session.metadata?.donation_intent_id === 'string' ? session.metadata.donation_intent_id : null;
    if (!intentId) {
      throw new Error('Missing donation_intent_id metadata on checkout session');
    }

    const { error: intentUpdateError } = await supabase
      .schema('donations')
      .from('donation_intents')
      .update({
        donor_id: donorId,
        stripe_session_id: session.id,
        status: session.payment_status === 'paid' ? 'paid' : 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', intentId);

    if (intentUpdateError) throw intentUpdateError;

    if (session.payment_status !== 'paid') {
      return;
    }

    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
    const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : null;
    const currency = typeof session.currency === 'string' ? session.currency.toUpperCase() : null;
    if (amountTotal === null || !currency) {
      throw new Error('Stripe session is missing amount_total or currency');
    }

    const { data: insertedPayment, error: insertPaymentError } = await supabase
      .schema('donations')
      .from('donation_payments')
      .insert({
        donation_intent_id: intentId,
        provider: 'stripe',
        provider_payment_id: paymentIntentId,
        amount_cents: amountTotal,
        currency,
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        raw_payload: session as unknown as Record<string, unknown>,
      })
      .select('id')
      .maybeSingle();

    if (insertPaymentError && !isUniqueViolation(insertPaymentError)) {
      throw insertPaymentError;
    }

    if (insertedPayment?.id && email) {
      await sendReceiptEmail({
        recipientEmail: email,
        amountCents: amountTotal,
        currency,
        kind: 'one_time',
        reference: insertedPayment.id,
      });
    }

    return;
  }

  if (mode === 'subscription') {
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
    if (!subscriptionId) {
      throw new Error('Missing subscription id on checkout session');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });

    const price = subscription.items.data[0]?.price;
    const priceId = typeof price?.id === 'string' ? price.id : null;
    const amountCents = typeof price?.unit_amount === 'number' ? price.unit_amount : null;
    const currency = typeof price?.currency === 'string' ? price.currency.toUpperCase() : null;

    if (!priceId || amountCents === null || !currency) {
      throw new Error('Unable to resolve subscription price details');
    }

    const status = mapSubscriptionStatus(subscription.status);

    const { error: upsertError } = await supabase
      .schema('donations')
      .from('donation_subscriptions')
      .upsert(
        {
          donor_id: donorId,
          status,
          currency,
          amount_cents: amountCents,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          started_at: subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          last_invoice_status: null,
          last_payment_at: null,
        },
        { onConflict: 'stripe_subscription_id' },
      );

    if (upsertError) throw upsertError;
    return;
  }

  throw new Error(`Unsupported checkout session mode: ${String(mode)}`);
}

async function handleInvoicePaid(
  { stripe, supabase }: { stripe: Stripe; supabase: SupabaseServiceClient },
  invoice: Stripe.Invoice,
) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
  const chargeId = typeof invoice.charge === 'string' ? invoice.charge : null;
  const invoiceId = invoice.id;
  const amountPaid = typeof invoice.amount_paid === 'number' ? invoice.amount_paid : null;
  const currency = typeof invoice.currency === 'string' ? invoice.currency.toUpperCase() : null;

  if (!subscriptionId || !customerId || amountPaid === null || !currency) {
    throw new Error('Invoice is missing required identifiers');
  }

  const donorId = await linkStripeCustomerToDonor({ stripe, supabase }, customerId, invoice.customer_email ?? null);

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
  const price = subscription.items.data[0]?.price;
  const priceId = typeof price?.id === 'string' ? price.id : null;
  const amountCents = typeof price?.unit_amount === 'number' ? price.unit_amount : null;

  if (!priceId || amountCents === null) {
    throw new Error('Invoice subscription is missing price details');
  }

  const status = mapSubscriptionStatus(subscription.status);

  const { data: dbSub, error: subError } = await supabase
    .schema('donations')
    .from('donation_subscriptions')
    .upsert(
      {
        donor_id: donorId,
        status,
        currency,
        amount_cents: amountCents,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        started_at: subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        last_invoice_status: invoice.status ?? null,
        last_payment_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' },
    )
    .select('id')
    .single();

  if (subError) throw subError;

  const { data: insertedPayment, error: insertPaymentError } = await supabase
    .schema('donations')
    .from('donation_payments')
    .insert({
      donation_subscription_id: dbSub.id,
      provider: 'stripe',
      provider_invoice_id: invoiceId,
      provider_charge_id: chargeId,
      provider_payment_id: null,
      amount_cents: amountPaid,
      currency,
      status: 'succeeded',
      processed_at: new Date().toISOString(),
      raw_payload: invoice as unknown as Record<string, unknown>,
    })
    .select('id')
    .maybeSingle();

  if (insertPaymentError && !isUniqueViolation(insertPaymentError)) {
    throw insertPaymentError;
  }

  const email = invoice.customer_email ? String(invoice.customer_email).trim().toLowerCase() : null;
  if (insertedPayment?.id && email) {
    await sendReceiptEmail({
      recipientEmail: email,
      amountCents: amountPaid,
      currency,
      kind: 'monthly',
      reference: insertedPayment.id,
    });
  }
}

async function handleInvoicePaymentFailed(
  { supabase }: { stripe: Stripe; supabase: SupabaseServiceClient },
  invoice: Stripe.Invoice,
) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
  if (!subscriptionId) {
    throw new Error('Invoice payment_failed missing subscription id');
  }

  await supabase
    .schema('donations')
    .from('donation_subscriptions')
    .update({
      last_invoice_status: invoice.status ?? null,
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);
}

async function handleSubscriptionUpdated(
  { stripe, supabase }: { stripe: Stripe; supabase: SupabaseServiceClient },
  subscription: Stripe.Subscription,
) {
  const subscriptionId = subscription.id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
  if (!subscriptionId || !customerId) {
    throw new Error('Subscription event missing ids');
  }

  const donorId = await linkStripeCustomerToDonor({ stripe, supabase }, customerId, null);
  const status = mapSubscriptionStatus(subscription.status);

  const price = subscription.items.data[0]?.price;
  const priceId = typeof price?.id === 'string' ? price.id : null;
  const amountCents = typeof price?.unit_amount === 'number' ? price.unit_amount : null;
  const currency = typeof price?.currency === 'string' ? price.currency.toUpperCase() : null;
  if (!priceId || amountCents === null || !currency) {
    throw new Error('Subscription event missing price details');
  }

  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;

  const { error } = await supabase
    .schema('donations')
    .from('donation_subscriptions')
    .upsert(
      {
        donor_id: donorId,
        status,
        currency,
        amount_cents: amountCents,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        started_at: subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : null,
        canceled_at: canceledAt,
      },
      { onConflict: 'stripe_subscription_id' },
    );

  if (error) throw error;
}

async function handleChargeRefunded(
  { supabase }: { stripe: Stripe; supabase: SupabaseServiceClient },
  charge: Stripe.Charge,
) {
  const chargeId = charge.id;
  if (!chargeId) {
    throw new Error('Refunded charge event missing id');
  }

  await supabase
    .schema('donations')
    .from('donation_payments')
    .update({ status: 'refunded' })
    .eq('provider_charge_id', chargeId);
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'active':
    case 'canceled':
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'trialing':
      return status;
    default:
      throw new Error(`Unhandled Stripe subscription status: ${String(status)}`);
  }
}

async function upsertDonor(supabase: SupabaseServiceClient, args: DonorUpsertArgs): Promise<string> {
  const email = args.email ? args.email.trim().toLowerCase() : null;
  if (!email) {
    throw new Error('Stripe customer_details.email is required to create donor record');
  }

  const payload = {
    email,
    name: args.name ?? null,
    address: args.address ?? null,
    stripe_customer_id: args.stripeCustomerId ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .schema('donations')
    .from('donors')
    .upsert(payload, { onConflict: 'email' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function linkStripeCustomerToDonor(
  { stripe, supabase }: { stripe: Stripe; supabase: SupabaseServiceClient },
  stripeCustomerId: string,
  email: string | null,
) {
  const { data: existing, error: existingError } = await supabase
    .schema('donations')
    .from('donors')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id as string;

  if (email) {
    const normalized = email.trim().toLowerCase();
    const { data: byEmail, error: byEmailError } = await supabase
      .schema('donations')
      .from('donors')
      .select('id')
      .eq('email', normalized)
      .maybeSingle();
    if (byEmailError) throw byEmailError;
    if (byEmail?.id) {
      await supabase
        .schema('donations')
        .from('donors')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', byEmail.id);
      return byEmail.id as string;
    }
  }

  const customer = await stripe.customers.retrieve(stripeCustomerId);
  const customerEmail =
    customer && !('deleted' in customer) && customer.email ? String(customer.email).trim().toLowerCase() : null;
  const customerName = customer && !('deleted' in customer) && customer.name ? String(customer.name) : null;
  const address = customer && !('deleted' in customer) ? customer.address ?? null : null;

  if (!customerEmail) {
    throw new Error('Stripe customer is missing email');
  }

  return await upsertDonor(supabase, {
    email: customerEmail,
    name: customerName,
    address,
    stripeCustomerId,
  });
}

async function sendReceiptEmail(args: ReceiptArgs) {
  if (!args.recipientEmail.includes('@')) {
    throw new Error('Receipt email recipient is invalid');
  }

  const smtp = requireSmtp();

  const amountLabel = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: args.currency,
    maximumFractionDigits: 0,
  }).format(args.amountCents / 100);

  const subject = args.kind === 'monthly' ? 'IHARC monthly donation receipt' : 'IHARC donation receipt';
  const dateLabel = new Date().toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

  const lines = [
    'Hello,',
    '',
    `Thank you for supporting IHARC. We received your ${args.kind === 'monthly' ? 'monthly' : 'one-time'} donation.`,
    '',
    `Amount: ${amountLabel}`,
    `Date: ${dateLabel}`,
    `Reference: ${args.reference}`,
    '',
    'IHARC is a registered non-profit (not yet a charity). This receipt is for record-keeping and is not tax deductible at this time.',
    '',
    'If you have any questions, reply to this email or contact donations@iharc.ca.',
    '',
    'In solidarity,',
    'IHARC — Integrated Homelessness and Addictions Response Centre',
  ].join('\n');

  const html = [
    '<p>Hello,</p>',
    `<p>Thank you for supporting IHARC. We received your ${args.kind === 'monthly' ? 'monthly' : 'one-time'} donation.</p>`,
    `<p><strong>Amount:</strong> ${escapeHtml(amountLabel)}<br />`,
    `<strong>Date:</strong> ${escapeHtml(dateLabel)}<br />`,
    `<strong>Reference:</strong> ${escapeHtml(args.reference)}</p>`,
    '<p>IHARC is a registered non-profit (not yet a charity). This receipt is for record-keeping and is not tax deductible at this time.</p>',
    '<p>If you have any questions, reply to this email or contact <a href="mailto:donations@iharc.ca">donations@iharc.ca</a>.</p>',
    '<p>In solidarity,<br />IHARC — Integrated Homelessness and Addictions Response Centre</p>',
  ].join('\n');

  let client: SMTPClient | null = null;
  try {
    client = new SMTPClient({
      connection: {
        hostname: smtp.host,
        port: smtp.port,
        tls: smtp.secure,
        auth: {
          username: smtp.username,
          password: smtp.password,
        },
      },
    });

    await client.send({
      from: smtp.from,
      to: args.recipientEmail,
      subject,
      content: lines,
      html,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
