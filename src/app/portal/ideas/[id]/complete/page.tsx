import { notFound, redirect } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { IdeaSubmissionForm } from '@/app/portal/ideas/submit/idea-form';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type IdeaMetricsRow = Database['portal']['Tables']['idea_metrics']['Row'];

type IdeaRow = Database['portal']['Tables']['ideas']['Row'];

function mapMetrics(rows: IdeaMetricsRow[]) {
  return rows.map((metric) => ({
    id: metric.id,
    label: metric.metric_label,
    definition: metric.success_definition,
    baseline: metric.baseline,
    target: metric.target,
  }));
}

export default async function CompleteIdeaPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(supabase, user.id);

  const resolvedParams = await params;
  const idParam = resolvedParams.id;
  const ideaId = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!ideaId) {
    notFound();
  }

  const portal = supabase.schema('portal');

  const { data: idea, error: ideaError } = await portal
    .from('ideas')
    .select(
      'id, author_profile_id, title, category, problem_statement, evidence, proposal_summary, implementation_steps, risks, tags, is_anonymous, publication_status',
    )
    .eq('id', ideaId)
    .maybeSingle<IdeaRow>();

  if (ideaError) {
    console.error('Failed to load idea for completion', ideaError);
    notFound();
  }

  if (!idea) {
    notFound();
  }

  if (idea.author_profile_id !== profile.id && profile.role !== 'moderator' && profile.role !== 'admin') {
    redirect(`/solutions/${ideaId}`);
  }

  const { data: metricsRows, error: metricsError } = await portal
    .from('idea_metrics')
    .select('id, metric_label, success_definition, baseline, target')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true })
    .returns<IdeaMetricsRow[]>();

  if (metricsError) {
    console.error('Failed to load idea metrics', metricsError);
    notFound();
  }

  const tags = Array.isArray(idea.tags) ? idea.tags : [];

  const initialIdea = {
    title: idea.title,
    category: idea.category,
    problemStatement: idea.problem_statement,
    evidence: idea.evidence,
    proposalSummary: idea.proposal_summary,
    implementationSteps: idea.implementation_steps,
    risks: idea.risks,
    tags,
    isAnonymous: idea.is_anonymous,
    metrics: mapMetrics(metricsRows ?? []),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Complete your idea</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Fill in evidence, steps, risks, and metrics so neighbours and moderators can help move this idea toward a
          Working Plan.
        </p>
      </div>
      <IdeaSubmissionForm
        mode="update"
        ideaId={ideaId}
        initialIdea={initialIdea}
        rulesAcknowledged={Boolean(profile.rules_acknowledged_at)}
        displayNameConfirmed={Boolean(profile.display_name_confirmed_at)}
      />
    </div>
  );
}
