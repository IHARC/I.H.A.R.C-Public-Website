import IdeasPage, { dynamic as ideasDynamic } from '@/app/ideas/page';

export const dynamic = ideasDynamic;

export default function CommandCenterIdeasPage(props: Parameters<typeof IdeasPage>[0]) {
  return IdeasPage(props);
}
