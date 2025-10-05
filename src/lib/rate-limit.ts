import { createSupabaseServiceClient } from '@/lib/supabase/service';

const WINDOW_MS = 5 * 60 * 1000;

type RateLimitParams = {
  profileId: string;
  type: 'idea' | 'comment' | 'flag' | 'idea_update';
  limit: number;
  cooldownMs?: number;
};

export type RateLimitResult =
  | { allowed: true; retryInMs: 0 }
  | { allowed: false; retryInMs: number };

export async function checkRateLimit(params: RateLimitParams): Promise<RateLimitResult> {
  const { profileId, type, limit, cooldownMs } = params;
  const supabase = createSupabaseServiceClient();
  const portal = supabase.schema('portal');
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  let table: 'ideas' | 'comments' | 'flags' | 'idea_edits';
  let column: string;

  if (type === 'idea') {
    table = 'ideas';
    column = 'author_profile_id';
  } else if (type === 'comment') {
    table = 'comments';
    column = 'author_profile_id';
  } else if (type === 'idea_update') {
    table = 'idea_edits';
    column = 'editor_profile_id';
  } else {
    table = 'flags';
    column = 'reporter_profile_id';
  }

  const { count, error } = await portal
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, profileId)
    .gte('created_at', since);

  if (error) {
    throw error;
  }

  const total = count ?? 0;
  let retryInMs = 0;
  let shouldThrottle = false;

  if (total >= limit) {
    shouldThrottle = true;
    const { data: oldest, error: oldestError } = await portal
      .from(table)
      .select('created_at')
      .eq(column, profileId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (oldestError) {
      throw oldestError;
    }

    if (oldest?.created_at) {
      const oldestTs = new Date(oldest.created_at).getTime();
      const windowRemaining = WINDOW_MS - (Date.now() - oldestTs);
      if (windowRemaining > retryInMs) {
        retryInMs = windowRemaining;
      }
    }
  }

  if (cooldownMs) {
    const { data: latest, error: recentError } = await portal
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
      const elapsed = Date.now() - last;
      const remaining = cooldownMs - elapsed;
      if (remaining > 0) {
        shouldThrottle = true;
        if (remaining > retryInMs) {
          retryInMs = remaining;
        }
      }
    }
  }

  if (shouldThrottle) {
    const safeRetry = Math.max(0, Math.ceil(retryInMs));
    return { allowed: false, retryInMs: safeRetry || 1000 };
  }

  return { allowed: true, retryInMs: 0 };
}
