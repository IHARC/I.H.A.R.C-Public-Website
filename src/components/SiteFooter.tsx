import Link from 'next/link';
import { getSiteFooterContent } from '@/data/site-footer';

export async function SiteFooter() {
  const footer = await getSiteFooterContent();

  return (
    <footer className="border-t border-outline/40 bg-surface px-4 py-6 text-center text-xs text-on-surface/70">
      <p>
        © {new Date().getFullYear()} {footer.primaryText}
      </p>
      {footer.secondaryText ? (
        <p className="mt-1 text-on-surface/60">{footer.secondaryText}</p>
      ) : null}
      <nav
        aria-label="Footer navigation"
        className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold"
      >
        <Link
          href="/get-help"
          className="rounded-full px-3 py-1 text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Get help
        </Link>
        <Link
          href="/resources"
          className="rounded-full px-3 py-1 text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Resources
        </Link>
        <Link
          href="/updates"
          className="rounded-full px-3 py-1 text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Updates
        </Link>
        <Link
          href="/donate"
          className="rounded-full px-3 py-1 text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Donate
        </Link>
        <Link
          href="/transparency"
          className="rounded-full px-3 py-1 text-primary underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Transparency
        </Link>
      </nav>
    </footer>
  );
}
