import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ALLOWED_PARAMS = ['category', 'status', 'tag', 'sort', 'q'] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SolutionsPage({ searchParams }: { searchParams: SearchParams }) {
  const resolved = await searchParams;
  const serialized = buildQuery(resolved);
  const target = serialized ? `/portal/ideas?${serialized}` : '/portal/ideas';
  redirect(target);
}

function buildQuery(params: Record<string, string | string[] | undefined>) {
  const next = new URLSearchParams();
  for (const key of ALLOWED_PARAMS) {
    const value = params[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => next.append(key, entry));
    } else {
      next.set(key, value);
    }
  }
  return next.toString();
}
