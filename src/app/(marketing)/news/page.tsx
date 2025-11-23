import type { Metadata } from 'next';
import Link from 'next/link';
import { listResources, formatResourceDate } from '@/lib/resources';
import { steviPortalUrl } from '@/lib/stevi-portal';

export const metadata: Metadata = {
  title: 'News & Updates — IHARC',
  description:
    'Stay current with IHARC announcements, council updates, and collaboration digests focused on housing stability and overdose response.',
};

export default async function NewsPage() {
  const steviHomeUrl = steviPortalUrl('/');
  const updates = await listResources({ kind: 'press' });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">News & Updates</p>
        <h1 className="text-4xl font-bold tracking-tight">Follow the collaborative work in real time</h1>
        <p className="text-base text-on-surface/80">
          IHARC keeps announcements brief and action-oriented. Updates highlight the STEVI work underway so anyone can see the evidence, discussion, and decisions behind each headline.
        </p>
      </header>

      <section className="space-y-4">
        {updates.length === 0 ? (
          <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-sm text-on-surface/80">
            <p>No updates are published yet. Check back soon.</p>
          </div>
        ) : (
          updates.map((update) => (
            <article key={update.id} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-on-surface">{update.title}</h2>
                <span className="text-sm font-medium uppercase tracking-wide text-on-surface/60">
                  {formatResourceDate(update.datePublished)}
                </span>
              </div>
              {update.summary ? <p className="mt-3 text-sm text-on-surface/80">{update.summary}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link
                  href={`/resources/${update.slug}`}
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
        <h2 className="text-2xl font-semibold text-on-surface">Want a deeper dive?</h2>
        <p className="mt-2">
          STEVI records every plan update, decision, and metric adjustment. Subscribe inside STEVI to receive notifications or export public RSS feeds.
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
