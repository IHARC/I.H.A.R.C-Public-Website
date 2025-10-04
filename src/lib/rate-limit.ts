import { createSupabaseServiceClient } from '@/lib/supabase/service';

const WINDOW_MS = 5 * 60 * 1000;

export async function checkRateLimit(params: { profileId: string; type: 'idea' | 'comment' | 'flag'; limit: number }) {
  const { profileId, type, limit } = params;
  const supabase = createSupabaseServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  let table: 'portal.ideas' | 'portal.comments' | 'portal.flags';
  let column: string;

  if (type === 'idea') {
    table = 'portal.ideas';
    column = 'author_profile_id';
  } else if (type === 'comment') {
    table = 'portal.comments';
    column = 'author_profile_id';
  } else {
    table = 'portal.flags';
    column = 'reporter_profile_id';
  }

  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, profileId)
    .gte('created_at', since);

  if (error) {
    throw error;
  }

  return (count ?? 0) < limit;
}
