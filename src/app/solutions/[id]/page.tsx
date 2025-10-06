import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyIdeaRoute({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await params;
  const idParam = resolved.id;
  const ideaId = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!ideaId) {
    redirect('/portal/ideas');
  }

  redirect(`/ideas/${ideaId}`);
}
