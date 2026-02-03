import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabasePublishableKey = requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const contentType = req.headers.get('content-type') ?? 'application/json';

  const rawBody = await req.arrayBuffer();

  const upstream = await fetch(`${supabaseUrl}/functions/v1/donations_stripe_webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'stripe-signature': signature,
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
    },
    body: rawBody,
  });

  const text = await upstream.text();
  const responseContentType = upstream.headers.get('content-type') ?? 'application/json';

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': responseContentType,
    },
  });
}
