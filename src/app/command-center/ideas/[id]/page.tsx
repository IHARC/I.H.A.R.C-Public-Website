import IdeaDetailPage, { dynamic as ideaDynamic } from '@/app/ideas/[id]/page';

export const dynamic = ideaDynamic;

export default function CommandCenterIdeaDetailPage(props: Parameters<typeof IdeaDetailPage>[0]) {
  return IdeaDetailPage(props);
}
