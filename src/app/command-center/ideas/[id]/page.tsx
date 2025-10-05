import IdeaDetailPage from '@/app/ideas/[id]/page';

export const dynamic = 'force-dynamic';

export default function CommandCenterIdeaDetailPage(props: Parameters<typeof IdeaDetailPage>[0]) {
  return IdeaDetailPage(props);
}
