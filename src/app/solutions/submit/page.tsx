import { redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { IdeaSubmissionForm } from './idea-form';

export const dynamic = 'force-dynamic';

export default async function SubmitIdeaPage() {
  const supabase = createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Submit a community solution</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Share solution-focused ideas for housing, health, harm reduction, and safety. No personal identifying information allowed.
        </p>
      </div>
      <IdeaSubmissionForm
        rulesAcknowledged={Boolean(profile.rules_acknowledged_at)}
        displayNameConfirmed={Boolean(profile.display_name_confirmed_at)}
      />
    </div>
  );
}
