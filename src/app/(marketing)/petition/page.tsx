import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile, type PortalProfile } from '@/lib/profile';
import { PetitionSignForm, type PetitionFormState } from '@/components/portal/petition/petition-sign-form';
import { PetitionPostSignActions } from '@/components/site/petition-post-sign-actions';
import { signPetition } from '@/lib/actions/sign-petition';
import type { Database } from '@/types/supabase';
import { deriveSignerDefaults } from '@/lib/petition/signature';

const PETITION_CANONICAL_PATH = '/petition';
const PETITION_DESCRIPTION =
  'Add your name to the public petition calling on the Town of Cobourg to declare a municipal State of Emergency over housing instability and the toxic drug crisis.';

export const metadata: Metadata = {
  title: 'Support the declaration — IHARC',
  description: PETITION_DESCRIPTION,
  alternates: {
    canonical: PETITION_CANONICAL_PATH,
  },
  openGraph: {
    type: 'article',
    title: 'Support the declaration — IHARC',
    description: PETITION_DESCRIPTION,
    url: PETITION_CANONICAL_PATH,
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
    title: 'Support the declaration — IHARC',
    description: PETITION_DESCRIPTION,
    images: ['/og-default.png'],
  },
};

const numberFormatter = new Intl.NumberFormat('en-CA');
const PETITION_SLUG = 'state-of-emergency';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

export default async function PetitionPage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const portal = supabase.schema('portal');
  const { data: petition, error } = await portal
    .from('petition_public_summary')
    .select('*')
    .eq('slug', PETITION_SLUG)
    .maybeSingle();

  if (error) {
    console.error('Failed to load petition summary', error);
  }

  if (!petition || !petition.is_active) {
    notFound();
  }

  let existingSignature: Pick<Database['portal']['Tables']['petition_signatures']['Row'], 'id' | 'created_at' | 'display_preference'> | null = null;
  let viewerProfile: PortalProfile | null = null;

  if (user) {
    const { data: signature } = await portal
      .from('petition_signatures')
      .select('id, created_at, display_preference')
      .eq('petition_id', petition.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (signature) {
      existingSignature = signature;
    }

    viewerProfile = await ensurePortalProfile(supabase, user.id);
  }

  const signerDefaults = user ? deriveSignerDefaults(user, viewerProfile) : null;

  const signatureCount = petition.signature_count ?? 0;
  const formattedCount = numberFormatter.format(signatureCount);
  const target = petition.target_signatures;
  const petitionUrl = `${APP_URL}/petition`;

  async function handleSign(_: PetitionFormState, formData: FormData): Promise<PetitionFormState> {
    'use server';

    return signPetition(formData, {
      petitionId: petition.id,
      revalidatePaths: ['/petition', '/petition/signers', `/portal/petition/${PETITION_SLUG}`],
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Support the declaration</p>
        <h1 className="text-4xl font-bold tracking-tight">Support the declaration</h1>
        <p className="text-base text-on-surface/80">
          Add your name to the public petition calling on the Town of Cobourg to declare a municipal State of Emergency over
          housing instability and the toxic drug crisis.
        </p>
        <p className="text-base text-on-surface">
          <strong>{formattedCount} neighbours have signed.</strong>{' '}
          Help keep housing and overdose response coordinated, transparent, and community-led.
        </p>
        {typeof target === 'number' && target > 0 ? (
          <p className="text-sm text-on-surface/70">Goal: {numberFormatter.format(target)} signatures</p>
        ) : null}
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <ListCard
          title="What signing does"
          items={[
            'Records your support with a timestamped signature.',
            'Adds you to the public count moderators share with Council.',
            'Sends your name to the Mayor and Council when the petition is delivered.',
          ]}
        />
        <ListCard
          title="What signing does not do"
          items={[
            'It does not bind Council to a decision.',
            'It does not replace formal decision-making processes.',
            'It does not share your personal story without consent.',
          ]}
        />
      </section>

      {existingSignature || viewerProfile?.has_signed_petition ? (
        <SignedMessage
          createdAt={existingSignature?.created_at ?? viewerProfile?.petition_signed_at ?? null}
          petitionUrl={petitionUrl}
        />
      ) : user ? (
        <div className="space-y-5 rounded-2xl border border-primary/20 bg-surface-container p-5">
          <PetitionSignForm action={handleSign} petitionId={petition.id} defaults={signerDefaults} />
          <p className="text-xs text-on-surface/60">
            After signing you will receive a confirmation message using the email or phone number you share. Moderators
            only follow up if you opt into petition updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-outline/20 bg-surface-container p-6">
          <h2 className="text-xl font-semibold text-on-surface">Create a free account to sign</h2>
          <p className="text-sm text-on-surface/70">
            Use your portal account to add your name. We keep your contact details private and only show what you choose in
            the public list.
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href={`/register?next=${encodeURIComponent('/petition')}`}
              className="rounded-full bg-primary px-5 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            >
              Create an account
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent('/petition')}`}
              className="rounded-full border border-outline/30 px-5 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-outline/20 bg-surface p-5">
      <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-on-surface/80">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignedMessage({ createdAt, petitionUrl }: { createdAt: string | null; petitionUrl: string }) {
  return (
    <div className="space-y-4 rounded-2xl border border-primary/25 bg-surface-container p-6">
      <p className="text-sm font-semibold text-on-surface">Thanks for supporting the declaration. You are signed in.</p>
      {createdAt ? (
        <p className="text-sm text-on-surface/70">
          Signed on {new Date(createdAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}.
        </p>
      ) : null}
      <PetitionPostSignActions petitionUrl={petitionUrl} />
    </div>
  );
}
