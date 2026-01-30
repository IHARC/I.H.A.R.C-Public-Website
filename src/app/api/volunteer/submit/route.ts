import { invokeSupabaseEdgeFunction, jsonFromUpstream } from '../../_shared/supabase-edge';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await invokeSupabaseEdgeFunction('volunteer_submit_application', body);
  return jsonFromUpstream(result);
}
