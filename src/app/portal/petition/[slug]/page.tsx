import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile, type PortalProfile } from '@/lib/profile';
import { PetitionSignForm, type PetitionFormState } from '@/components/portal/petition/petition-sign-form';
import { PetitionPostSignActions } from '@/components/site/petition-post-sign-actions';
import { signPetition } from '@/lib/actions/sign-petition';
import type { Database } from '@/types/supabase';
import { deriveSignerDefaults, type PetitionSignerDefaults } from '@/lib/petition/signature';

export const dynamic = 'force-dynamic';

const numberFormatter = new Intl.NumberFormat('en-CA');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';
const DEFAULT_PETITION_TITLE = 'Support the declaration — IHARC';
const DEFAULT_PETITION_DESCRIPTION =
  'Add your name to the public petition so neighbours, agencies, and the Town can coordinate housing and overdose supports.';

type PetitionSummary = Database['portal']['Views']['petition_public_summary']['Row'];
type PetitionSignature = Database['portal']['Tables']['petition_signatures']['Row'];

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slugParam = resolvedParams.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug) {
    return {
      title: DEFAULT_PETITION_TITLE,
      description: DEFAULT_PETITION_DESCRIPTION,
      alternates: {
        canonical: '/portal/petition',
      },
    };
  }

  try {
    const supabase = await createSupabaseRSCClient();
    const portal = supabase.schema('portal');
    const { data: petition } = await portal
      .from('petition_public_summary')
      .select('title, lede, is_active, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!petition || !petition.is_active) {
      return {
        title: DEFAULT_PETITION_TITLE,
        description: DEFAULT_PETITION_DESCRIPTION,
        alternates: {
          canonical: `/portal/petition/${slug}`,
        },
      };
    }

    const canonicalPath = `/portal/petition/${petition.slug}`;
    const title = `${petition.title} — IHARC`;
    const description = petition.lede ?? DEFAULT_PETITION_DESCRIPTION;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: 'article',
        title,
        description,
        url: canonicalPath,
        images: [
          {
            url: '/og-default.png',
            width: 1200,
            height: 630,
            alt: 'IHARC Command Center — Community collaboration for housing and health',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-default.png'],
      },
    };
  } catch (error) {
    console.warn('Failed to build petition metadata', error);
    const canonicalPath = `/portal/petition/${slug}`;
    return {
      title: DEFAULT_PETITION_TITLE,
      description: DEFAULT_PETITION_DESCRIPTION,
      alternates: {
        canonical: canonicalPath,
      },
    };
  }
}

export default async function PetitionPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const slugParam = resolvedParams.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug) {
    notFound();
  }
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const portal = supabase.schema('portal');
  const { data: petition, error } = await portal
    .from('petition_public_summary')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Failed to load petition', error);
    notFound();
  }

  if (!petition || !petition.is_active) {
    notFound();
  }

let existingSignature: Pick<PetitionSignature, 'id' | 'created_at' | 'statement' | 'share_with_partners'> | null = null;
  let viewerProfile: PortalProfile | null = null;

  if (user) {
    const { data: signature, error: signatureError } = await portal
      .from('petition_signatures')
      .select('id, created_at, statement, share_with_partners')
      .eq('petition_id', petition.id)
      .limit(1)
      .maybeSingle();
    if (signatureError) {
      console.warn('Failed to check existing petition signature', signatureError);
    }
    if (signature) {
      existingSignature = signature;
    }

    viewerProfile = await ensurePortalProfile(supabase, user.id);
  }

  const signerDefaults = user ? deriveSignerDefaults(user, viewerProfile) : null;

  return (
    <PetitionPageContent
      petition={petition}
      existingSignature={existingSignature}
      isAuthenticated={Boolean(user)}
      viewerProfile={viewerProfile}
      signerDefaults={signerDefaults}
    />
  );
}

type PetitionPageContentProps = {
  petition: PetitionSummary;
  existingSignature: Pick<PetitionSignature, 'id' | 'created_at' | 'statement' | 'share_with_partners'> | null;
  isAuthenticated: boolean;
  viewerProfile: PortalProfile | null;
  signerDefaults: PetitionSignerDefaults | null;
};

function PetitionPageContent({ petition, existingSignature, isAuthenticated, viewerProfile, signerDefaults }: PetitionPageContentProps) {
  const signatureCount = petition.signature_count ?? 0;
  const target = petition.target_signatures;
  const progressPercentage = typeof target === 'number' && target > 0 ? Math.min(100, Math.round((signatureCount / target) * 100)) : null;
  const descriptionParagraphs: string[] = petition.description
    ? petition.description
        .split('\n')
        .map((paragraph) => paragraph.trim())
        .filter((paragraph): paragraph is string => paragraph.length > 0)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12 text-on-surface">
      <header className="space-y-6 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">State of Emergency Petition</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{petition.title}</h1>
        <p className="max-w-3xl text-lg text-on-surface/80">{petition.lede}</p>
        {petition.hero_statement ? (
          <p className="max-w-3xl text-base text-on-surface/80">{petition.hero_statement}</p>
        ) : null}
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-outline/15 bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Why this petition matters</h2>
          <p className="mt-2 text-sm text-on-surface/70">
            Every signature signals that neighbours expect compassionate, transparent housing and overdose supports. Moderators log updates so the community can see how commitments move forward.
          </p>
          {petition.pledge_statement ? (
            <p className="mt-4 rounded-2xl bg-surface-container px-5 py-4 text-sm text-on-surface">
              {petition.pledge_statement}
            </p>
          ) : null}
        </div>
        <div className="rounded-3xl border border-outline/15 bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface/60">Signatures recorded</h2>
          <p className="mt-3 text-4xl font-bold text-on-surface">{numberFormatter.format(signatureCount)}</p>
          {typeof target === 'number' && target > 0 ? (
            <p className="text-sm text-on-surface/70">Goal: {numberFormatter.format(target)} neighbours</p>
          ) : (
            <p className="text-sm text-on-surface/70">Goal: keep the declaration moving with public backing</p>
          )}
          {progressPercentage !== null ? (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-outline/10">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPercentage}%` }}
                  aria-hidden
                />
              </div>
              <p className="mt-1 text-xs font-medium text-on-surface/60">{progressPercentage}% of the target reached</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-outline/15 bg-surface p-6 shadow-sm">
        <div className="space-y-2 text-balance">
          <h2 className="text-2xl font-semibold">Add your name</h2>
          <p className="text-sm text-on-surface/70">
            Signing is free and uses the same secure login as the collaboration portal. After you sign you can join conversations on ideas and plans without creating another account.
          </p>
        </div>
        <PetitionSignSection
          petition={petition}
          viewerProfile={viewerProfile}
          existingSignature={existingSignature}
          isAuthenticated={isAuthenticated}
          signerDefaults={signerDefaults}
        />
        <div className="text-xs text-on-surface/60">
          <p>
            Need to review the declaration first? <Link href="/emergency" className="text-primary underline">Read the brief</Link>.
          </p>
        </div>
      </section>

      {descriptionParagraphs.length ? (
        <section className="space-y-4 text-balance">
          <h2 className="text-2xl font-semibold">What the declaration commits to</h2>
          <div className="space-y-3 text-base text-on-surface/80">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 8)}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-outline/15 bg-surface p-6 shadow-sm text-sm text-on-surface/70">
        <p>
          After signing you will receive a confirmation message using the email or phone number you share. Moderators may
          contact petition signers about upcoming collaboration sessions only if you opt in. Your name is stored securely
          and only visible to portal moderators.
        </p>
        {(() => {
          const signedAt = existingSignature?.created_at ?? viewerProfile?.petition_signed_at;
          if (!signedAt) return null;
          return (
            <p className="mt-3 text-on-surface">
              You signed this petition on{' '}
              {new Date(signedAt).toLocaleDateString('en-CA', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              .
            </p>
          );
        })()}
      </section>
    </div>
  );
}

type PetitionSignSectionProps = {
  petition: PetitionSummary;
  viewerProfile: PortalProfile | null;
  existingSignature: Pick<PetitionSignature, 'id' | 'created_at' | 'statement' | 'share_with_partners'> | null;
  isAuthenticated: boolean;
  signerDefaults: PetitionSignerDefaults | null;
};

function PetitionSignSection({ petition, viewerProfile, existingSignature, isAuthenticated, signerDefaults }: PetitionSignSectionProps) {
  const petitionPath = `/portal/petition/${petition.slug}`;
  const petitionUrl = `${APP_URL}/petition`;

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 rounded-2xl border border-outline/15 bg-surface-container p-5">
        <p className="text-sm text-on-surface">
          Create a free account or sign in with your existing portal credentials to add your name to the petition.
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={`/register?next=${encodeURIComponent(petitionPath)}`}
            className="rounded-full bg-primary px-5 py-2 text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
          >
            Create an account
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(petitionPath)}`}
            className="rounded-full border border-outline/30 px-5 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (existingSignature || viewerProfile?.has_signed_petition) {
    const signedAt = existingSignature?.created_at ?? viewerProfile?.petition_signed_at ?? null;
    return (
      <div className="space-y-3 rounded-2xl border border-primary/25 bg-surface-container p-5">
        <p className="text-sm font-medium text-on-surface">
          Thank you — your signature is already recorded.
        </p>
        {signedAt ? (
          <p className="text-sm text-on-surface/70">
            Signed on{' '}
            {new Date(signedAt).toLocaleDateString('en-CA', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            . If you need to update your note or withdraw support, contact the moderator team.
          </p>
        ) : null}
        {existingSignature?.statement ? (
          <div className="rounded-xl bg-surface px-4 py-3 text-sm text-on-surface/80">
            <p className="font-medium text-on-surface">Your private note</p>
            <p className="mt-1 whitespace-pre-wrap">{existingSignature.statement}</p>
          </div>
        ) : null}
        <PetitionPostSignActions petitionUrl={petitionUrl} />
      </div>
    );
  }

  async function handleSign(prevState: PetitionFormState, formData: FormData): Promise<PetitionFormState> {
    'use server';

    const result = await signPetition(formData, {
      petitionId: petition.id,
      revalidatePaths: [petitionPath, '/petition', '/petition/signers'],
    });

    return result;
  }

  return (
    <div className="space-y-5 rounded-2xl border border-primary/15 bg-surface-container p-5">
      <PetitionSignForm action={handleSign} petitionId={petition.id} defaults={signerDefaults} />
      <p className="text-xs text-on-surface/60">
        After signing you will receive a confirmation message using the email or phone number you share. Moderators may
        follow up only if you opt in to additional contact.
      </p>
    </div>
  );
}
