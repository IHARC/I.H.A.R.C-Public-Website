import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { ModerationQueue } from '@/components/portal/moderation-queue';

export default async function ModerationPage() {
  const supabase = createSupabaseRSCClient();
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

  const { data: flags } = await supabase
    .from('portal.flags')
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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Moderation queue</h1>
      <ModerationQueue flags={flags ?? []} />
    </div>
  );
}
