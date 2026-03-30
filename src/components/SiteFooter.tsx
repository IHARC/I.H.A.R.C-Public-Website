import Link from 'next/link';
import { getSiteFooterContent } from '@/data/site-footer';

export async function SiteFooter() {
  const footer = await getSiteFooterContent();

  return (
    <footer className="border-t border-outline/18 bg-surface-container-low px-4 py-10 text-on-surface sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Integrated Homelessness and Addictions Response Centre</p>
          <p className="font-heading text-3xl font-semibold tracking-[-0.03em] text-on-surface">
            Public accountability, current support information, and a clearer path into care.
          </p>
          <p className="max-w-xl text-sm leading-7 text-on-surface/72">
            © {new Date().getFullYear()} {footer.primaryText}
          </p>
          {footer.secondaryText ? <p className="text-sm leading-7 text-on-surface/64">{footer.secondaryText}</p> : null}
        </div>
        <nav aria-label="Footer navigation" className="grid gap-2 text-sm font-semibold sm:grid-cols-2">
          <Link
            href="/get-help"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-primary underline-offset-4 transition hover:bg-surface hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
          >
            Get help
          </Link>
          <Link
            href="/resources"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-primary underline-offset-4 transition hover:bg-surface hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
          >
            Resources
          </Link>
          <Link
            href="/updates"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-primary underline-offset-4 transition hover:bg-surface hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
          >
            Updates
          </Link>
          <Link
            href="/transparency"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-primary underline-offset-4 transition hover:bg-surface hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
          >
            Transparency
          </Link>
          <Link
            href="/donate"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-primary underline-offset-4 transition hover:bg-surface hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
          >
            Donate
          </Link>
        </nav>
      </div>
    </footer>
  );
}
