import Link from 'next/link';
import { listResources, formatResourceDate } from '@/lib/resources';
import { steviPortalUrl } from '@/lib/stevi-portal';

export default async function BlogPage() {
  const steviHomeUrl = steviPortalUrl('/');
  const posts = await listResources({ kind: 'blog' });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Blog</p>
        <h1 className="text-4xl font-bold tracking-tight">Stories and field notes from the IHARC response</h1>
        <p className="text-base text-on-surface/80">
          These longer reads connect the work happening across IHARC partners to the people and moments shaping Northumberland County. Each post links back to the public evidence inside STEVI.
        </p>
      </header>

      <section className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-sm text-on-surface/80">
            <p>No blog posts are published yet. Check back soon.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-on-surface">{post.title}</h2>
                <span className="text-sm font-medium uppercase tracking-wide text-on-surface/60">
                  {formatResourceDate(post.datePublished)}
                </span>
              </div>
              {post.summary ? <p className="mt-3 text-sm text-on-surface/80">{post.summary}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link
                  href={`/resources/${post.slug}`}
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Read post
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="rounded-3xl border border-outline/20 bg-surface-container p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Need the full public record?</h2>
        <p className="mt-2">
          STEVI tracks every plan update, decision, and metric adjustment. Visit the portal to review public evidence and export updates.
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
