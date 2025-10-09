import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile, type PortalProfile } from '@/lib/profile';
import { PetitionSignForm, type PetitionFormState } from '@/components/portal/petition/petition-sign-form';
import { PetitionGuestSignForm } from '@/components/portal/petition/petition-guest-sign-form';
import { PetitionPostSignActions } from '@/components/site/petition-post-sign-actions';
import { signPetition } from '@/lib/actions/sign-petition';
import { signPetitionGuest, type GuestPetitionFormState } from '@/lib/actions/sign-petition-guest';
import type { Database } from '@/types/supabase';
import { deriveSignerDefaults, type PetitionSignerDefaults } from '@/lib/petition/signature';

export const dynamic = 'force-dynamic';

const numberFormatter = new Intl.NumberFormat('en-CA');
const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Toronto',
  timeZoneName: 'short',
});
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';
const DEFAULT_PETITION_TITLE = 'Support the declaration — IHARC';
const DEFAULT_PETITION_DESCRIPTION =
  'Add your name to the public petition so neighbours, agencies, and the Town can coordinate housing and overdose supports.';
const PETITION_SOCIAL_IMAGE = '/Petition-image.png';
const PETITION_SOCIAL_ALT = 'IHARC petition call to action with neighbours supporting the declaration.';

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
      openGraph: {
        type: 'article',
        title: DEFAULT_PETITION_TITLE,
        description: DEFAULT_PETITION_DESCRIPTION,
        url: '/portal/petition',
        images: [
          {
            url: PETITION_SOCIAL_IMAGE,
            alt: PETITION_SOCIAL_ALT,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_PETITION_TITLE,
        description: DEFAULT_PETITION_DESCRIPTION,
        images: [PETITION_SOCIAL_IMAGE],
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
        openGraph: {
          type: 'article',
          title: DEFAULT_PETITION_TITLE,
          description: DEFAULT_PETITION_DESCRIPTION,
          url: `/portal/petition/${slug}`,
          images: [
            {
              url: PETITION_SOCIAL_IMAGE,
              alt: PETITION_SOCIAL_ALT,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: DEFAULT_PETITION_TITLE,
          description: DEFAULT_PETITION_DESCRIPTION,
          images: [PETITION_SOCIAL_IMAGE],
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
            url: PETITION_SOCIAL_IMAGE,
            alt: PETITION_SOCIAL_ALT,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [PETITION_SOCIAL_IMAGE],
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
      openGraph: {
        type: 'article',
        title: DEFAULT_PETITION_TITLE,
        description: DEFAULT_PETITION_DESCRIPTION,
        url: canonicalPath,
        images: [
          {
            url: PETITION_SOCIAL_IMAGE,
            alt: PETITION_SOCIAL_ALT,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_PETITION_TITLE,
        description: DEFAULT_PETITION_DESCRIPTION,
        images: [PETITION_SOCIAL_IMAGE],
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
  const target = typeof petition.target_signatures === 'number' && petition.target_signatures > 0 ? petition.target_signatures : null;
  const signatureProgressText = target
    ? `${numberFormatter.format(signatureCount)} / ${numberFormatter.format(target)} neighbours`
    : `${numberFormatter.format(signatureCount)} neighbours`;
  const lastUpdatedAt = petition.last_signed_at ?? petition.updated_at ?? petition.created_at ?? null;
  const lastUpdatedText = lastUpdatedAt ? dateTimeFormatter.format(new Date(lastUpdatedAt)) : null;
  const signedAt = existingSignature?.created_at ?? viewerProfile?.petition_signed_at ?? null;
  const pledgeStatement = petition.pledge_statement?.trim() ?? '';
  const pledgeParagraphs = pledgeStatement
    ? pledgeStatement.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12 text-on-surface">
      <header className="space-y-6 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">State of Emergency Petition</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Add your name: call on Cobourg to declare a municipal State of Emergency
        </h1>
        <div className="space-y-4 text-base text-on-surface/80">
          <p>
            Declaring a municipal State of Emergency is <strong>not a silver bullet</strong>—it’s the starting line. It formally
            recognizes that homelessness and addiction have reached emergency levels and that Cobourg must activate a{' '}
            <strong>coordinated emergency response</strong> under its existing emergency plan.
          </p>
          <p>
            A declaration won’t fix everything overnight, but it lets everyone—Town, agencies, and community—operate under one
            structure with clear direction and accountability.
          </p>
        </div>
        <p className="text-lg font-semibold text-error/90 sm:text-xl">
          <span className="font-bold">Every day that passes is another day this crisis goes unmanaged.</span> Add your name to
          call for an organized, transparent response that replaces confusion and finger-pointing with coordination and
          measurable progress.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-3xl border border-outline/15 bg-surface-container p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="#sign-petition"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
        >
          Sign Now
        </Link>
        <p className="text-sm text-on-surface">
          <span className="font-semibold text-on-surface">{signatureProgressText}</span>
          {lastUpdatedText ? (
            <>
              <span aria-hidden className="mx-2 text-on-surface/60">
                •
              </span>
              <span className="font-semibold text-on-surface">Last updated {lastUpdatedText}</span>
            </>
          ) : null}
        </p>
      </section>

      <section id="emergency-brief" className="space-y-5 rounded-3xl border border-outline/15 bg-surface p-6 text-balance">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Emergency brief: why this declaration matters</h2>
          <p className="text-base text-on-surface/80">
            A municipal declaration is a coordination tool. It speeds staffing and purchasing for housing and overdose response
            and requires public updates with clear accountability. It is not punitive.
          </p>
          <p className="text-base text-on-surface/80">
            This briefing brings together the evidence, commitments, and guardrails that Northumberland partners track together.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-on-surface">What it is</h3>
            <p className="text-base text-on-surface/80">
              A formal step that lets the head of council direct resources faster and report progress in one place, using the
              Incident Management System to align departments and partners.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-on-surface">Why now</h3>
            <p className="text-base text-on-surface/80">
              Shelter capacity, outreach reports, and overdose data show rising displacement and drug poisonings. Existing
              processes move too slowly to keep neighbours safe.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-on-surface">What it enables</h3>
            <ul className="space-y-2 rounded-2xl border border-outline/20 bg-surface-container p-5 text-base text-on-surface/80">
              <li>Faster purchasing of critical health and safety supplies without weeks of tendering.</li>
              <li>Quicker coordination of placements, outreach coverage, and staffing.</li>
              <li>A single public brief with accountable updates and measurable metrics.</li>
            </ul>
            <div className="rounded-2xl border border-outline/20 bg-surface px-5 py-4 text-sm text-on-surface/80">
              <h4 className="text-base font-semibold text-on-surface">What this unlocks in practice</h4>
              <ul className="mt-2 space-y-2">
                <li>Rapid hotel overflow when shelter beds are full or unsafe.</li>
                <li>Bulk procurement of naloxone, warming gear, and mobile health supplies.</li>
                <li>Unified updates so neighbours, agencies, and Council review decisions in one place.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-on-surface">Guardrails</h3>
            <p className="text-base text-on-surface/80">
              Plain-language updates, anonymized reporting, public feedback loops, and documentation of enforcement-only ideas
              without advancement keep this focused on care, not punishment.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-on-surface">Learn more</h3>
            <p className="text-base text-on-surface/80">
              Recent coverage outlines why community partners are urging Council to act. Read the summary from{' '}
              <Link
                href="https://todaysnorthumberland.ca/2025/10/02/iharc-calls-on-cobourg-to-declare-a-state-of-emergency/amp/"
                className="text-primary underline"
              >
                Today&apos;s Northumberland
              </Link>{' '}
              for additional context.
            </p>
          </div>
        </div>
      </section>

      {pledgeParagraphs.length > 0 ? (
        <section className="space-y-5 rounded-3xl border border-outline/15 bg-surface p-6 shadow-sm">
          <div className="space-y-2 text-balance">
            <h2 className="text-2xl font-semibold">Community pledge</h2>
            <div className="space-y-3 text-base text-on-surface/80">
              {pledgeParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="sign-petition" className="space-y-5 rounded-3xl border border-outline/15 bg-surface p-6 shadow-sm">
        <div className="space-y-2 text-balance">
          <h2 className="text-2xl font-semibold">Sign the petition</h2>
          <p className="text-sm text-on-surface/70">
            Use your portal login or the secure email option below to add your name. Verified signatures keep the public tally
            accurate and respectful.
          </p>
        </div>
        <PetitionSignSection
          petition={petition}
          viewerProfile={viewerProfile}
          existingSignature={existingSignature}
          isAuthenticated={isAuthenticated}
          signerDefaults={signerDefaults}
        />
      </section>

      <section className="space-y-4 text-balance">
        <h2 className="text-2xl font-semibold">What this declaration does</h2>
        <ul className="space-y-3 text-base text-on-surface/80">
          <li>
            Activates the <strong>Town’s emergency management framework</strong>, using the proven Incident Management System
            (IMS) model
          </li>
          <li>
            Unifies municipal departments, health, housing, and community supports under <strong>one coordinated plan</strong>
          </li>
          <li>
            Establishes a clear <strong>command structure</strong> with defined roles and public reporting
          </li>
          <li>
            Commits to <strong>open communication</strong>, shared data, and plain-language updates
          </li>
          <li>Treats homelessness and addiction with the same seriousness as any other emergency</li>
        </ul>
      </section>

      <section className="space-y-4 text-balance">
        <h2 className="text-2xl font-semibold">What this declaration does not do</h2>
        <ul className="space-y-3 text-base text-on-surface/80">
          <li>It does <strong>not</strong> create new enforcement powers</li>
          <li>It does <strong>not</strong> create new spending powers</li>
          <li>It does <strong>not</strong> solve the crisis by itself</li>
        </ul>
        <p className="text-base text-on-surface/80">
          It sets the stage for coordination—so decisions, data, and people finally move in the same direction.
        </p>
      </section>

      <section className="space-y-4 text-balance">
        <h2 className="text-2xl font-semibold">What comes next</h2>
        <p className="text-base text-on-surface/80">
          After the declaration, the Town can immediately stand up a unified <strong>Incident Management Team (IMT)</strong> to
          coordinate the local response. That team can draw on the experience and infrastructure already operating in the
          community—including IHARC’s outreach systems, data tools, and collaboration platform—to accelerate progress and
          maintain transparency.
        </p>
        <h3 className="text-lg font-semibold text-on-surface">Key early actions include:</h3>
        <ul className="space-y-3 text-base text-on-surface/80">
          <li>
            Standing up a <strong>Local Emergency Operations Group</strong> using the IMS model
          </li>
          <li>
            Publishing a <strong>clear Emergency Response Plan</strong> with short-term objectives and public metrics
          </li>
          <li>
            Launching a <strong>public dashboard</strong> to track progress and outcomes
          </li>
          <li>
            Drawing ideas from the <strong>IHARC Collaboration Portal</strong>, where residents, front-line workers, and
            agencies already propose and iterate local solutions
          </li>
          <li>
            Establishing a <strong>predictable reporting cycle</strong> for Council and the public
          </li>
        </ul>
        <p className="text-base font-medium text-on-surface">
          A declaration doesn’t end the crisis—it’s how we begin managing it properly.
        </p>
      </section>

      <section className="space-y-4 text-balance">
        <h2 className="text-2xl font-semibold">Privacy and verification</h2>
        <p className="text-base text-on-surface/80">
          Each signature is verified by email to protect against spam. You can choose to display your full name or initials on
          the public list. We collect only your name, email, and postal code to verify local support. Your email is never shared,
          and you can remove your signature at any time.
        </p>
        {signedAt ? (
          <p className="text-base text-on-surface">
            You signed this petition on{' '}
            {new Date(signedAt).toLocaleDateString('en-CA', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            .
          </p>
        ) : null}
      </section>

      <section className="space-y-4 text-balance">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <dl className="space-y-6 text-base text-on-surface/80">
          <div className="space-y-2">
            <dt className="font-semibold text-on-surface">What is a municipal State of Emergency?</dt>
            <dd>
              Under Ontario’s <em>Emergency Management and Civil Protection Act (EMCPA)</em>, a mayor can declare a local
              emergency to activate the Town’s emergency plan. It’s a coordination tool—not an expansion of authority.
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="font-semibold text-on-surface">Why is this needed?</dt>
            <dd>
              Because fragmented responses have failed. This declaration creates a structure where agencies, data, and decisions
              align—and where results are publicly tracked.
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="font-semibold text-on-surface">What happens after it’s declared?</dt>
            <dd>
              The Town establishes an <strong>Incident Management Team (IMT)</strong> and begins executing a unified{' '}
              <strong>Emergency Response Plan</strong>. Existing community systems, like IHARC’s outreach and collaboration
              infrastructure, plug into that structure immediately to speed communication and coordination. See{' '}
              <Link href="/after-the-declaration" className="text-primary underline">
                After the Declaration
              </Link>{' '}
              for the roadmap.
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="font-semibold text-on-surface">Does this change police or bylaw powers?</dt>
            <dd>No. It’s about coordination, not enforcement.</dd>
          </div>
          <div className="space-y-2">
            <dt className="font-semibold text-on-surface">How will the public stay informed?</dt>
            <dd>
              Through <strong>weekly updates</strong>, an open dashboard, and transparent timelines showing what’s being done
              and who’s responsible.
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-3xl border border-outline/15 bg-surface-container p-6 text-balance text-base text-on-surface/80">
        <p className="text-lg font-semibold text-on-surface">Closing message</p>
        <p>
          A State of Emergency isn’t about panic—it’s about leadership, structure, and honesty. Cobourg has the people,
          knowledge, and tools to respond effectively. What’s missing is the framework to bring them together.
        </p>
        <p className="font-semibold text-on-surface">
          Add your name today—because the absence of coordination is the real emergency.
        </p>
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
    const handleGuestSign = async (
      prevState: GuestPetitionFormState,
      formData: FormData,
    ): Promise<GuestPetitionFormState> => {
      'use server';

      return signPetitionGuest(formData, {
        petitionId: petition.id,
        petitionSlug: petition.slug,
        revalidatePaths: [petitionPath],
      });
    };

    return (
      <div className="space-y-5">
        <div className="space-y-4 rounded-2xl border border-outline/15 bg-surface-container p-5">
          <p className="text-sm text-on-surface">
            Create a free account or sign in with your existing portal credentials to add your name to the petition. When
            you're logged in you can follow ideas, comment on plans, and receive updates.
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
          <p className="text-xs text-on-surface/60">
            Prefer not to create an account? Use the secure email option below to verify your signature.
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-surface-container p-5">
          <PetitionGuestSignForm action={handleGuestSign} petitionId={petition.id} />
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
