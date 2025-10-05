import IdeasPage from '@/app/ideas/page';

export const dynamic = 'force-dynamic';

export default function CommandCenterIdeasPage(props: Parameters<typeof IdeasPage>[0]) {
  return IdeasPage(props);
}
