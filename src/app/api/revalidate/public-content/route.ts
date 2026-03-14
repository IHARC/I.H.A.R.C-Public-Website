import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { invalidateAllPublicSiteCaches } from '@/lib/cache/invalidate';

const DEV_ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
const SECRET_HEADER = 'x-public-site-revalidate-secret';

function hasValidSecret(request: Request, secret: string) {
  const provided = request.headers.get(SECRET_HEADER);
  if (!provided) {
    return false;
  }

  const secretBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);

  if (secretBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(secretBuffer, providedBuffer);
}

function isAuthorizedRequest(request: Request) {
  const secret = process.env.PUBLIC_SITE_REVALIDATE_SECRET?.trim();
  if (secret && hasValidSecret(request, secret)) {
    return { ok: true, mode: 'secret' as const };
  }

  if (process.env.NODE_ENV !== 'production') {
    const origin = request.headers.get('origin')?.toLowerCase();
    if (origin && DEV_ALLOWED_ORIGINS.has(origin)) {
      return { ok: true, mode: 'dev-origin' as const };
    }
  }

  return { ok: false, mode: 'denied' as const };
}

export async function POST(request: Request) {
  const auth = isAuthorizedRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await invalidateAllPublicSiteCaches();
  await revalidatePath('/sitemap.xml');

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  return NextResponse.json({
    ok: true,
    mode: auth.mode,
    received: payload,
  });
}
