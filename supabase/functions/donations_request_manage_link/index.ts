import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
import { buildCorsHeaders, getSiteOrigin, json } from '../_shared/http.ts';

type Payload = { email?: unknown };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const EMAIL_FROM = Deno.env.get('PORTAL_EMAIL_FROM');
const SMTP_HOST = Deno.env.get('PORTAL_SMTP_HOST');
const SMTP_PORT_RAW = Deno.env.get('PORTAL_SMTP_PORT');
const SMTP_PORT = Number(SMTP_PORT_RAW ?? '');
const SMTP_USERNAME = Deno.env.get('PORTAL_SMTP_USERNAME');
const SMTP_PASSWORD = Deno.env.get('PORTAL_SMTP_PASSWORD');
const SMTP_SECURE_RAW = Deno.env.get('PORTAL_SMTP_SECURE');
const SMTP_SECURE = (SMTP_SECURE_RAW ?? '').toLowerCase() === 'true';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for donations_request_manage_link');
}
if (!EMAIL_FROM || !EMAIL_FROM.includes('@')) {
  throw new Error('PORTAL_EMAIL_FROM is not configured for donations_request_manage_link');
}
if (!SMTP_HOST || !SMTP_PORT_RAW || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_SECURE_RAW) {
  throw new Error('SMTP credentials are not configured for donations_request_manage_link');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

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

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { ok: true }, 200);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return json(req, { ok: true }, 200);
  }

  const emailHash = await sha256Hex(email);

  const [rlIp, rlEmail] = await Promise.all([
    supabase.schema('donations').rpc('donations_check_rate_limit', {
      p_event: 'donations:manage_link:ip',
      p_identifier: ipHash,
      p_limit: 6,
      p_window_ms: 10 * 60 * 1000,
      p_cooldown_ms: 2_000,
    }),
    supabase.schema('donations').rpc('donations_check_rate_limit', {
      p_event: 'donations:manage_link:email',
      p_identifier: emailHash,
      p_limit: 3,
      p_window_ms: 30 * 60 * 1000,
      p_cooldown_ms: 30_000,
    }),
  ]);

  if (rlIp.error || rlEmail.error) {
    console.error('donations_request_manage_link rate limit error', rlIp.error ?? rlEmail.error);
    return json(req, { ok: true }, 200);
  }

  const allowedIp = (rlIp.data as { allowed?: unknown }[] | null)?.[0]?.allowed !== false;
  const allowedEmail = (rlEmail.data as { allowed?: unknown }[] | null)?.[0]?.allowed !== false;
  if (!allowedIp || !allowedEmail) {
    return json(req, { ok: true }, 200);
  }

  const { data: donor, error: donorError } = await supabase
    .schema('donations')
    .from('donors')
    .select('id, email, stripe_customer_id')
    .eq('email', email)
    .maybeSingle();

  if (donorError) {
    console.error('donations_request_manage_link donor lookup error', donorError);
    return json(req, { ok: true }, 200);
  }

  if (!donor?.id) {
    return json(req, { ok: true }, 200);
  }

  const { data: activeSubscription, error: subError } = await supabase
    .schema('donations')
    .from('donation_subscriptions')
    .select('id, status')
    .eq('donor_id', donor.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.error('donations_request_manage_link subscription lookup error', subError);
    return json(req, { ok: true }, 200);
  }

  if (!activeSubscription?.id || !donor.stripe_customer_id) {
    return json(req, { ok: true }, 200);
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await sha256Hex(token);

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { error: insertError } = await supabase.schema('donations').from('donor_manage_tokens').insert({
    donor_id: donor.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error('donations_request_manage_link token insert error', insertError);
    return json(req, { ok: true }, 200);
  }

  const link = `${siteOrigin}/manage-donation/portal?token=${encodeURIComponent(token)}`;

  const greeting = 'Hello,';
  const textBody = [
    greeting,
    '',
    'You requested a link to manage a monthly donation to IHARC.',
    '',
    `Open this secure link to manage your donation: ${link}`,
    '',
    'This link expires in 30 minutes. If you did not request it, you can ignore this email.',
    '',
    'If anything looks off, reply to this email or contact donations@iharc.ca.',
    '',
    'In solidarity,',
    'IHARC — Integrated Homelessness and Addictions Response Centre',
  ].join('\\n');

  const htmlBody = [
    `<p>${escapeHtml(greeting)}</p>`,
    '<p>You requested a link to manage a monthly donation to IHARC.</p>',
    `<p><a href="${escapeHtml(link)}">Open the secure manage link</a></p>`,
    '<p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>',
    '<p>If anything looks off, reply to this email or contact <a href="mailto:donations@iharc.ca">donations@iharc.ca</a>.</p>',
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
      content: textBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('donations_request_manage_link SMTP send error', error);
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
