import { invokeSupabaseEdgeFunction, jsonFromUpstream } from '../_shared/supabase-edge';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await invokeSupabaseEdgeFunction<{ ok?: unknown }>('donations_request_manage_link', body);
  return jsonFromUpstream(result);
}

