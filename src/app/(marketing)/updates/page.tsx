import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { formatResourceDate, listResources } from '@/lib/resources';
import { buildMarketingMetadata } from '@/lib/site-metadata';
import { steviPortalUrl } from '@/lib/stevi-portal';

export async function generateMetadata(): Promise<Metadata> {
  return buildMarketingMetadata({
    title: 'Updates — IHARC',
    description:
      'Read IHARC news and field updates about homelessness response, community coordination, and public accountability in Northumberland County.',
    path: '/updates',
  });
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type UpdatesView = 'all' | 'news' | 'blog';

const viewOptions: Array<{ value: UpdatesView; label: string; href: string }> = [
  { value: 'all', label: 'All updates', href: '/updates' },
  { value: 'news', label: 'News', href: '/updates?view=news' },
  { value: 'blog', label: 'Blog', href: '/updates?view=blog' },
];

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
    <div className="mx-auto w-full max-w-6xl px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <div className="space-y-16">
        <header className="grid gap-8 border-b border-outline/12 pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
          <div className="max-w-3xl space-y-5 text-balance">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Updates</p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Public updates from the field, the response table, and the work ahead.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              This feed combines IHARC announcements and longer-form public notes. It is meant to
              help people understand what changed, why it matters, and where to find the deeper
              public record.
            </p>
          </div>
          <div className="space-y-4 border-t border-outline/12 pt-6 text-sm leading-7 text-on-surface/72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p>
              Use Updates for public communication. Use the Transparency Hub for policies and source
              documents. Use Data for current public metrics.
            </p>
          </div>
        </header>

        <section className="grid gap-4 border-b border-outline/12 pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Filter the feed
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Scan by format without losing the timeline.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {viewOptions.map((option) => {
              const isActive = option.value === view;
              return (
                <Link
                  key={option.value}
                  href={option.href}
                  className={
                    isActive
                      ? 'inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                      : 'inline-flex min-h-11 items-center rounded-full border border-outline/25 px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          {filtered.length === 0 ? (
            <div className="rounded-[1.75rem] bg-surface-container-low px-6 py-6 text-sm leading-7 text-on-surface/74">
              No updates are published yet. Check back soon.
            </div>
          ) : (
            filtered.map((update) => (
              <article
                key={update.id}
                className="grid gap-5 border-b border-outline/12 pb-6 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_12rem]"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-primary/45 bg-primary/10 text-primary">
                      {update.kind === 'press' ? 'News' : 'Blog'}
                    </Badge>
                    {update.location ? (
                      <span className="text-xs uppercase tracking-[0.18em] text-on-surface/60">
                        {update.location}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
                      {update.title}
                    </h2>
                    {update.summary ? (
                      <p className="max-w-3xl text-sm leading-7 text-on-surface/74">{update.summary}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/updates/${update.slug}`}
                    className="inline-flex min-h-11 w-fit items-center rounded-full border border-outline/25 px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Read update
                  </Link>
                </div>
                <div className="flex items-start lg:justify-end">
                  <span className="inline-flex min-h-11 items-center rounded-full bg-surface-container-low px-4 py-2 text-xs uppercase tracking-[0.18em] text-on-surface/62">
                    {formatResourceDate(update.datePublished)}
                  </span>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="rounded-[2rem] bg-surface-container-low px-6 py-8 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Secure records
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Need the operational detail behind a public update?
              </h2>
              <p className="text-sm leading-7 text-on-surface/74">
                STEVI holds the secure record for participating teams, including appointments,
                exports, and role-based operational context that does not belong on the public site.
              </p>
            </div>
            <Link
              href={steviHomeUrl}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              STEVI Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
