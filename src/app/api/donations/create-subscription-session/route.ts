import { invokeSupabaseEdgeFunction, jsonFromUpstream } from '../../_shared/supabase-edge';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await invokeSupabaseEdgeFunction<{ url?: unknown }>('donations_create_subscription_session', body);
  return jsonFromUpstream(result);
}

