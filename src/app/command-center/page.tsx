import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const serialized = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedParams)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => serialized.append(key, entry));
    } else {
      serialized.set(key, value);
    }
  }

  const target = serialized.toString() ? `/ideas?${serialized.toString()}` : '/ideas';
  redirect(target);
}
