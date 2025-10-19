import { unstable_cache } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { CACHE_TAGS } from '@/lib/cache/tags';
import type { Database } from '@/types/supabase';

type PlanRow = Database['portal']['Tables']['plans']['Row'];
type FocusAreaRow = Database['portal']['Tables']['plan_focus_areas']['Row'];
type KeyDateRow = Database['portal']['Tables']['plan_key_dates']['Row'];

export type PlanListItem = PlanRow & {
  focus_areas: FocusAreaRow[];
  key_dates: KeyDateRow[];
  nextKeyDate: KeyDateRow | null;
};

type PlanListCacheKey = {
  viewerId: string | null;
};

const PLAN_LIST_REVALIDATE_SECONDS = 180;

const fetchPlans = unstable_cache(
  async (_: PlanListCacheKey): Promise<PlanListItem[]> => {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');

    const { data: planRows, error } = await portal
      .from('plans')
      .select(
        `*,
         focus_areas:plan_focus_areas(id, name, summary, created_at),
         key_dates:plan_key_dates(id, title, scheduled_for, notes, created_at)`
      )
      .order('promoted_at', { ascending: false })
      .returns<Array<PlanRow & { focus_areas: FocusAreaRow[]; key_dates: KeyDateRow[] }>>();

    if (error) {
      console.error('Unable to load plans', error);
      return [];
    }

    return (planRows ?? []).map((plan) => ({
      ...plan,
      nextKeyDate:
        plan.key_dates
          .map((entry) => ({ ...entry, scheduled_at: new Date(entry.scheduled_for) }))
          .filter((entry) => !Number.isNaN(entry.scheduled_at.valueOf()))
          .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime())[0] ?? null,
    }));
  },
  ['portal:plans:list'],
  {
    tags: [CACHE_TAGS.plansList],
    revalidate: PLAN_LIST_REVALIDATE_SECONDS,
  },
);

export async function getPlanList(viewerId: string | null) {
  return fetchPlans({ viewerId });
}
