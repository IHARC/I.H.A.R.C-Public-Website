import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { ModerationQueue, type ModerationFlag } from '@/components/portal/moderation-queue';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const supabase = await createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(user.id);
  if (!['moderator', 'admin'].includes(profile.role)) {
    redirect('/solutions');
  }

  const { data: flagRows } = await portal
    .from('flags')
    .select(
      `id,
       entity_type,
       entity_id,
       reason,
       details,
       status,
       created_at,
       reporter:reporter_profile_id(display_name),
       idea:idea_id(title, status),
       comment:comment_id(body, idea_id, is_official)`
    )
    .neq('status', 'resolved')
    .order('created_at', { ascending: false });

  const flags: ModerationFlag[] = (flagRows ?? []).map((flag) => ({
    ...flag,
    reporter: Array.isArray(flag.reporter) ? flag.reporter[0] ?? null : flag.reporter,
    idea: Array.isArray(flag.idea) ? flag.idea[0] ?? null : flag.idea,
    comment: Array.isArray(flag.comment) ? flag.comment[0] ?? null : flag.comment,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Moderation queue</h1>
      <ModerationQueue flags={flags} />
    </div>
  );
}
