import { requireEnv } from './env.ts';

function normalizeOrigin(raw: string): string | null {
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(): Set<string> {
  const siteOrigin = normalizeOrigin(requireEnv('IHARC_SITE_URL'));
  if (!siteOrigin) {
    throw new Error('IHARC_SITE_URL must be a valid absolute URL');
  }

  const origins = new Set<string>([
    siteOrigin,
    siteOrigin.includes('://www.') ? siteOrigin.replace('://www.', '://') : siteOrigin.replace('://', '://www.'),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  return origins;
}

export function getSiteOrigin(): string {
  const origin = normalizeOrigin(requireEnv('IHARC_SITE_URL'));
  if (!origin) {
    throw new Error('IHARC_SITE_URL must be a valid absolute URL');
  }
  return origin;
}

export function buildCorsHeaders(req: Request): HeadersInit {
  const originHeader = req.headers.get('origin');
  const origin = originHeader ? normalizeOrigin(originHeader) : null;
  const allowed = allowedOrigins();
  const siteOrigin = getSiteOrigin();
  const allowOrigin = origin && allowed.has(origin) ? origin : siteOrigin;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

