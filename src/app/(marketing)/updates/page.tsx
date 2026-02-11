import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatResourceDate, listResources } from '@/lib/resources';
import { steviPortalUrl } from '@/lib/stevi-portal';

export const metadata: Metadata = {
  title: 'Updates — IHARC',
  description:
    'Read IHARC news and blog updates about housing stability, overdose response, and coordinated community action in Northumberland County.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type UpdatesView = 'all' | 'news' | 'blog';

function readView(value: string | null): UpdatesView {
  if (value === 'news') return 'news';
  if (value === 'blog') return 'blog';
  return 'all';
}

function fromSearchParams(params: Record<string, string | string[] | undefined>): UpdatesView {
  const raw = params.view;
  const value = Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
  return readView(value);
}

export default async function UpdatesPage({ searchParams }: { searchParams?: SearchParams }) {
  const resolved = (await searchParams) ?? {};
  const view = fromSearchParams(resolved);

  const updates = await listResources({ channel: 'updates' });
  const filtered =
    view === 'news'
      ? updates.filter((item) => item.kind === 'press')
      : view === 'blog'
        ? updates.filter((item) => item.kind === 'blog')
        : updates;

  const steviHomeUrl = steviPortalUrl('/');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Updates</p>
        <h1 className="text-4xl font-bold tracking-tight">News and field notes from the IHARC response</h1>
        <p className="text-base text-on-surface/80">
          Browse announcements and long-form updates in one place. For SOPs, policies, and governance documentation, use the Transparency Hub.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={view === 'all' ? 'default' : 'outline'} size="sm">
          <Link href="/updates">All updates</Link>
        </Button>
        <Button asChild variant={view === 'news' ? 'default' : 'outline'} size="sm">
          <Link href="/updates?view=news">News</Link>
        </Button>
        <Button asChild variant={view === 'blog' ? 'default' : 'outline'} size="sm">
          <Link href="/updates?view=blog">Blog</Link>
        </Button>
      </div>

      <section className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-sm text-on-surface/80">
            <p>No updates are published yet. Check back soon.</p>
          </div>
        ) : (
          filtered.map((update) => (
            <article key={update.id} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-on-surface">{update.title}</h2>
                <span className="text-sm font-medium uppercase tracking-wide text-on-surface/60">
                  {formatResourceDate(update.datePublished)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline">{update.kind === 'press' ? 'News' : 'Blog'}</Badge>
                {update.location ? <span className="text-xs text-on-surface/60">{update.location}</span> : null}
              </div>
              {update.summary ? <p className="mt-3 text-sm text-on-surface/80">{update.summary}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link
                  href={`/updates/${update.slug}`}
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Read update
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="rounded-3xl border border-outline/20 bg-surface-container p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Want the full public record?</h2>
        <p className="mt-2">
          STEVI tracks public plan updates, decisions, and metrics. Visit the portal to review source records and exports.
        </p>
        <Link
          href={steviHomeUrl}
          prefetch={false}
          className="mt-4 inline-flex w-fit rounded-full bg-primary px-5 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Open STEVI
        </Link>
      </section>
    </div>
  );
}
