import PortalIdeasPage from '@/app/portal/ideas/page';

export const dynamic = 'force-dynamic';

export default function CommandCenterIdeasPage(props: Parameters<typeof PortalIdeasPage>[0]) {
  return PortalIdeasPage(props);
}
