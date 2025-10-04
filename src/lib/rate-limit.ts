import { createSupabaseServiceClient } from '@/lib/supabase/service';

const WINDOW_MS = 5 * 60 * 1000;

type RateLimitParams = {
  profileId: string;
  type: 'idea' | 'comment' | 'flag';
  limit: number;
  cooldownMs?: number;
};

export async function checkRateLimit(params: RateLimitParams) {
  const { profileId, type, limit, cooldownMs } = params;
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

  if ((count ?? 0) >= limit) {
    return false;
  }

  if (cooldownMs) {
    const { data: latest, error: recentError } = await supabase
      .from(table)
      .select('created_at')
      .eq(column, profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentError) {
      throw recentError;
    }

    if (latest?.created_at) {
      const last = new Date(latest.created_at).getTime();
      if (Date.now() - last < cooldownMs) {
        return false;
      }
    }
  }

  return true;
}
