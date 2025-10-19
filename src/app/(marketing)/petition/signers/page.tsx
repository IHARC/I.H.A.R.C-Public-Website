import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SupportDeclarationLink } from '@/components/site/support-declaration-link';
import type { Database } from '@/types/supabase';
import { getPetitionPublicSummary, getPetitionSigners } from '@/data/petition';

export const dynamic = 'force-dynamic';

const PETITION_SOCIAL_IMAGE = '/Petition-image.png';
const PETITION_SOCIAL_ALT = 'IHARC petition call to action with neighbours supporting the declaration.';

export const metadata: Metadata = {
  title: 'Petition signers — IHARC',
  description: 'See the public list of neighbours supporting the State of Emergency declaration.',
  alternates: {
    canonical: '/petition/signers',
  },
  openGraph: {
    type: 'article',
    title: 'Petition signers — IHARC',
    description: 'See the public list of neighbours supporting the State of Emergency declaration.',
    url: '/petition/signers',
    images: [
      {
        url: PETITION_SOCIAL_IMAGE,
        alt: PETITION_SOCIAL_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Petition signers — IHARC',
    description: 'See the public list of neighbours supporting the State of Emergency declaration.',
    images: [PETITION_SOCIAL_IMAGE],
  },
};

const PAGE_SIZE = 25;
const PETITION_SLUG = 'state-of-emergency';

export default async function PetitionSignersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const rawPage = Array.isArray(resolvedParams.page) ? resolvedParams.page[0] : resolvedParams.page;
  const currentPage = Math.max(1, Number(rawPage) || 1);

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const petition = await getPetitionPublicSummary(PETITION_SLUG);

  if (!petition) {
    notFound();
  }

  const { signers, total } = await getPetitionSigners({
    petitionId: petition.id,
    slug: PETITION_SLUG,
    from,
    to,
  });

  const totalSigners = total || petition.signature_count || 0;
  const totalPages = Math.max(1, Math.ceil(totalSigners / PAGE_SIZE));
  const hasNextPage = currentPage < totalPages;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Public signers</p>
        <h1 className="text-4xl font-bold tracking-tight">Neighbours backing the declaration</h1>
        <p className="text-base text-on-surface/80">
          This list reflects display preferences chosen by each signer. Only the total count is shared with Council; contact
          details stay private with moderators.
        </p>
        <SupportDeclarationLink
          href="/petition"
          source="petition_signers"
          className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Support the declaration
        </SupportDeclarationLink>
      </header>

      <section className="space-y-4">
        <p className="text-sm text-on-surface/70">
          Total signatures: <strong>{new Intl.NumberFormat('en-CA').format(totalSigners)}</strong>
        </p>
        <ol className="space-y-3" start={from + 1}>
          {signers.map((signer, index) => {
            const position = from + index + 1;
            return (
              <li
                key={`${signer.display_name}-${signer.created_at ?? position}`}
                className="rounded-2xl border border-outline/20 bg-surface p-4 text-sm text-on-surface/80"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-on-surface">{signer.display_name ?? 'Anonymous neighbour'}</span>
                  {signer.created_at ? (
                    <time dateTime={signer.created_at} className="text-xs text-on-surface/60">
                      {new Date(signer.created_at).toLocaleDateString('en-CA', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  ) : null}
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-on-surface/50">
                  {formatPreference(signer.display_preference)}
                </p>
              </li>
            );
          })}
        </ol>
        {signers.length === 0 ? (
          <p className="rounded-2xl border border-outline/20 bg-surface p-4 text-sm text-on-surface/70">
            Signatures will appear here once the petition receives public support.
          </p>
        ) : null}
      </section>

      <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
        <PaginationLink page={currentPage - 1} disabled={currentPage <= 1}>
          Previous
        </PaginationLink>
        <span className="text-on-surface/70">
          Page {currentPage} of {totalPages}
        </span>
        <PaginationLink page={currentPage + 1} disabled={!hasNextPage}>
          Next
        </PaginationLink>
      </nav>
    </div>
  );
}

function PaginationLink({ page, disabled, children }: { page: number; disabled: boolean; children: ReactNode }) {
  if (disabled || page < 1) {
    return <span className="text-on-surface/40">{children}</span>;
  }

  const search = new URLSearchParams();
  search.set('page', String(page));

  return (
    <Link
      href={`/petition/signers?${search.toString()}`}
      className="rounded-full border border-outline/30 px-4 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </Link>
  );
}

function formatPreference(preference: Database['portal']['Enums']['petition_display_preference'] | null) {
  switch (preference) {
    case 'anonymous':
      return 'Anonymous';
    case 'first_name_last_initial':
      return 'First name + last initial';
    case 'full_name':
      return 'Full name';
    default:
      return 'Display preference not provided';
  }
}
