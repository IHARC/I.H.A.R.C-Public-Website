import PlanDetailPage, { dynamic as planDynamic } from '@/app/plans/[slug]/page';

export const dynamic = planDynamic;

export default function CommandCenterRoadmapDetailPage(props: Parameters<typeof PlanDetailPage>[0]) {
  return PlanDetailPage(props);
}
