import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyPlansRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectWithParams('/portal/plans', searchParams);
}

async function redirectWithParams(
  basePath: string,
  searchParams: Promise<Record<string, string | string[] | undefined>>
) {
  const params = await searchParams;
  const serialized = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => serialized.append(key, entry));
    } else {
      serialized.set(key, value);
    }
  }

  const query = serialized.toString();
  const target = query ? `${basePath}?${query}` : basePath;
  redirect(target);
}
