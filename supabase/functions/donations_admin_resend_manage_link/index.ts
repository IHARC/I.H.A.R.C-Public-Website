import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';

type Payload = { email?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const EMAIL_FROM = Deno.env.get('PORTAL_EMAIL_FROM');
const SMTP_HOST = Deno.env.get('PORTAL_SMTP_HOST');
const SMTP_PORT_RAW = Deno.env.get('PORTAL_SMTP_PORT');
const SMTP_PORT = Number(SMTP_PORT_RAW ?? '');
const SMTP_USERNAME = Deno.env.get('PORTAL_SMTP_USERNAME');
const SMTP_PASSWORD = Deno.env.get('PORTAL_SMTP_PASSWORD');
const SMTP_SECURE_RAW = Deno.env.get('PORTAL_SMTP_SECURE');
const SMTP_SECURE = (SMTP_SECURE_RAW ?? '').toLowerCase() === 'true';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_admin_resend_manage_link');
}
if (!EMAIL_FROM || !EMAIL_FROM.includes('@')) {
  throw new Error('PORTAL_EMAIL_FROM is not configured for donations_admin_resend_manage_link');
}
if (!SMTP_HOST || !SMTP_PORT_RAW || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_SECURE_RAW) {
  throw new Error('SMTP credentials are not configured for donations_admin_resend_manage_link');
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

  const { data: isAdmin } = await userClient.rpc('check_iharc_admin_role');
  if (isAdmin !== true) {
    return json(req, { error: 'Insufficient permissions' }, 403);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'Invalid payload' }, 400);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return json(req, { error: 'Invalid email' }, 422);
  }

  const { data: donor, error: donorError } = await serviceClient
    .schema('donations')
    .from('donors')
    .select('id, stripe_customer_id')
    .eq('email', email)
    .maybeSingle();
  if (donorError || !donor?.id || !donor.stripe_customer_id) {
    return json(req, { error: 'No active donor record' }, 404);
  }

  const { data: activeSubscription } = await serviceClient
    .schema('donations')
    .from('donation_subscriptions')
    .select('id')
    .eq('donor_id', donor.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSubscription?.id) {
    return json(req, { error: 'No active subscription found' }, 404);
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { error: insertError } = await serviceClient.schema('donations').from('donor_manage_tokens').insert({
    donor_id: donor.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (insertError) {
    console.error('donations_admin_resend_manage_link token insert error', insertError);
    return json(req, { error: 'Unable to create link' }, 500);
  }

  const siteOrigin = getSiteOrigin();
  const link = `${siteOrigin}/manage-donation/portal?token=${encodeURIComponent(token)}`;

  const content = [
    'Hello,',
    '',
    'Here is your secure link to manage a monthly donation to IHARC:',
    link,
    '',
    'This link expires in 30 minutes. If you did not request it, you can ignore this email.',
    '',
    'In solidarity,',
    'IHARC — Integrated Homelessness and Addictions Response Centre',
  ].join('\\n');

  const html = [
    '<p>Hello,</p>',
    '<p>Here is your secure link to manage a monthly donation to IHARC:</p>',
    `<p><a href="${escapeHtml(link)}">Open the secure manage link</a></p>`,
    '<p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>',
    '<p>In solidarity,<br />IHARC — Integrated Homelessness and Addictions Response Centre</p>',
  ].join('\\n');

  let client: SMTPClient | null = null;
  try {
    client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_SECURE,
        auth: {
          username: SMTP_USERNAME,
          password: SMTP_PASSWORD,
        },
      },
    });

    await client.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Manage your monthly donation to IHARC',
      content,
      html,
    });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {
        // ignore
      }
    }
  }

  return json(req, { ok: true }, 200);
});

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
