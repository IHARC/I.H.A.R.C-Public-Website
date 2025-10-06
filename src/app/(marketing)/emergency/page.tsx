import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { SupportDeclarationLink } from '@/components/site/support-declaration-link';

export const metadata: Metadata = {
  title: 'State of Emergency Brief — IHARC',
  description:
    'Understand why Northumberland partners declared a housing and overdose emergency, what the declaration enables, and how to share your support.',
};

const numberFormatter = new Intl.NumberFormat('en-CA');

const PETITION_SLUG = 'state-of-emergency';

export default async function EmergencyBriefPage() {
  const supabase = await createSupabaseRSCClient();
  const supportHref = siteConfig.emergency.supportHref;

  const { data: petition, error } = await supabase
    .schema('portal')
    .from('petition_public_summary')
    .select('signature_count, target_signatures')
    .eq('slug', PETITION_SLUG)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load petition summary for emergency brief', error);
  }

  const signatureCount = petition?.signature_count ?? 0;
  const formattedCount = numberFormatter.format(signatureCount);

  return (
    <article className="mx-auto w-full max-w-4xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          State of Emergency Declaration
        </p>
        <h1 className="text-4xl font-bold tracking-tight">A coordinated response to keep neighbours safe</h1>
        <p className="text-lg text-on-surface/80">
          A municipal declaration is a coordination tool. It speeds staffing and purchasing for housing and overdose response. It requires public updates and clear roles. It is not punitive.
        </p>
        <p className="text-base text-on-surface/80">
          This brief summarizes the shared evidence, commitments, and accountability measures supporting the declaration.
        </p>
        <p className="text-base text-on-surface">
          <strong>{formattedCount} neighbours have signed.</strong>{' '}
          <SupportDeclarationLink
            href={supportHref}
            source="emergency_page"
            className="text-primary underline"
          >
            Support the declaration
          </SupportDeclarationLink>{' '}
          to show support for a coordinated, transparent response.
        </p>
      </header>

      <div className="space-y-10">
        <section id="what-it-is" className="space-y-3 text-balance">
          <h2 className="text-2xl font-semibold">What it is</h2>
          <p className="text-base text-on-surface/80">
            A formal step that lets the head of council direct resources faster and report progress in one place.
          </p>
        </section>
        <section id="why-now" className="space-y-3 text-balance">
          <h2 className="text-2xl font-semibold">Why now</h2>
          <p className="text-base text-on-surface/80">
            Shelter capacity, outreach reports, and emergency response data show rising displacement and drug poisonings. Current tools are too slow.
          </p>
        </section>
        <section id="what-it-enables" className="space-y-3 text-balance">
          <h2 className="text-2xl font-semibold">What it enables</h2>
          <ul className="list-disc space-y-2 pl-5 text-base text-on-surface/80">
            <li>Faster purchasing of health and safety supplies and essential services.</li>
            <li>Quicker coordination of placements and staffing.</li>
            <li>A single public brief with accountable updates.</li>
          </ul>
        </section>
        <section id="guardrails" className="space-y-3 text-balance">
          <h2 className="text-2xl font-semibold">Guardrails</h2>
          <p className="text-base text-on-surface/80">
            Plain-language updates. Anonymized reporting. Public feedback. Documentation of enforcement-only ideas without advancement.
          </p>
        </section>
      </div>

      <footer className="space-y-4 rounded-3xl border border-outline/20 bg-surface p-8">
        <h2 className="text-2xl font-semibold">Keep the momentum going</h2>
        <p className="text-on-surface/80">
          Support the declaration and add feedback inside the collaboration portal. Moderators capture every comment and log next steps.
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <SupportDeclarationLink
            href={supportHref}
            source="emergency_page"
            className="rounded-full bg-primary px-6 py-3 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Support the declaration
          </SupportDeclarationLink>
          <Link
            href="/portal/ideas/submit"
            className="rounded-full border border-outline/30 px-6 py-3 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Provide feedback or propose an idea
          </Link>
        </div>
      </footer>
    </article>
  );
}
