import PlanDetailPage from '@/app/portal/plans/[slug]/page';

export const dynamic = 'force-dynamic';

export default function CommandCenterRoadmapDetailPage(props: Parameters<typeof PlanDetailPage>[0]) {
  return PlanDetailPage(props);
}
