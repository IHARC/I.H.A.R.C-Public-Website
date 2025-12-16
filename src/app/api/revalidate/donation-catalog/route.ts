import { NextResponse } from 'next/server';
import { invalidateDonationCatalog } from '@/lib/cache/invalidate';

export const dynamic = 'force-dynamic';

const SECRET_HEADER = 'x-revalidate-secret';

function requireSecret(): string {
  const secret = process.env.MARKETING_REVALIDATE_SECRET;
  if (!secret) {
    throw new Error('Missing MARKETING_REVALIDATE_SECRET.');
  }
  return secret;
}

export async function POST(req: Request) {
  const expected = requireSecret();
  const provided = req.headers.get(SECRET_HEADER);

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await invalidateDonationCatalog();
  return NextResponse.json({ ok: true });
}

