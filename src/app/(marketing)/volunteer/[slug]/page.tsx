import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VolunteerApplyForm } from '../volunteer-apply-form';
import { formatVolunteerDate, getVolunteerRoleBySlug } from '@/data/volunteers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const role = await getVolunteerRoleBySlug(slug);
  if (!role) {
    return {
      title: 'Volunteer role not found — IHARC',
    };
  }

  return {
    title: `${role.title} — Volunteer with IHARC`,
    description: role.summary ?? `Volunteer role with the Integrated Homelessness and Addictions Response Centre.`,
    alternates: { canonical: `${SITE_URL}/volunteer/${role.slug}` },
  };
}

export default async function VolunteerRolePage({ params }: PageProps) {
  const { slug } = await params;
  const role = await getVolunteerRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  const requirementItems = splitLines(role.requirements);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VolunteerOpportunity',
    name: role.title,
    description: role.summary ?? role.description,
    url: `${SITE_URL}/volunteer/${role.slug}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Integrated Homelessness and Addictions Response Centre',
    },
    validThrough: role.closesAt ?? undefined,
  } as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4">
        <Button asChild variant="ghost" className="px-0 text-on-surface">
          <Link href="/volunteer">← Back to volunteer roles</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight">{role.title}</h1>
          {role.closesAt ? <Badge variant="secondary">Closes {formatVolunteerDate(role.closesAt)}</Badge> : null}
        </div>
        {role.summary ? <p className="text-base text-on-surface/80">{role.summary}</p> : null}
        <div className="flex flex-wrap gap-4 text-sm text-on-surface/70">
          <span>Location: {role.location ?? 'Flexible'}</span>
          <span>Time commitment: {role.timeCommitment ?? 'Flexible'}</span>
          {role.publishedAt ? <span>Published {formatVolunteerDate(role.publishedAt)}</span> : null}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-on-surface">Role overview</h2>
            <p className="whitespace-pre-line text-on-surface/80">{role.description}</p>
          </div>

          {requirementItems.length ? (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-on-surface">Requirements</h3>
              <ul className="list-disc space-y-2 pl-5 text-on-surface/80">
                {requirementItems.map((item, index) => (
                  <li key={`${role.id}-req-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <VolunteerApplyForm roleId={role.id} organizationId={role.organizationId} roleTitle={role.title} />
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}

function splitLines(value: string | null) {
  if (!value) return [] as string[];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
