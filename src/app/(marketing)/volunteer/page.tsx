import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchVolunteerRoles, formatVolunteerDate, isVolunteerRoleOpen } from '@/data/volunteers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iharc.ca';

export const metadata: Metadata = {
  title: 'Volunteer with IHARC — Integrated Homelessness and Addictions Response Centre',
  description:
    'Explore volunteer opportunities with IHARC and support Northumberland County partners coordinating housing and overdose response.',
};

export default async function VolunteerPage() {
  const roles = await fetchVolunteerRoles();
  const openRoles = roles.filter(isVolunteerRoleOpen);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Volunteer with IHARC',
    description:
      'Volunteer opportunities with the Integrated Homelessness and Addictions Response Centre in Northumberland County.',
    url: `${SITE_URL}/volunteer`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'IHARC — Integrated Homelessness and Addictions Response Centre',
      url: SITE_URL,
    },
    about: {
      '@type': 'Organization',
      name: 'Integrated Homelessness and Addictions Response Centre',
    },
  } as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Volunteer with IHARC</p>
        <h1 className="text-4xl font-bold tracking-tight">
          Show up for neighbours navigating housing and overdose crises
        </h1>
        <p className="text-base text-on-surface/80">
          The Integrated Homelessness and Addictions Response Centre (IHARC) partners with local agencies, municipalities, and volunteers to build coordinated, compassionate responses. Browse open roles and apply to join the team.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-on-surface">Open volunteer roles</h2>
            <Badge variant="outline">{openRoles.length} open</Badge>
          </div>

          {openRoles.length > 0 ? (
            <div className="grid gap-4">
              {openRoles.map((role) => (
                <Card key={role.id} className="border-outline/20 bg-surface">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{role.title}</CardTitle>
                      {role.closesAt ? <Badge variant="secondary">Closes {formatVolunteerDate(role.closesAt)}</Badge> : null}
                    </div>
                    <CardDescription>{role.summary ?? 'No summary provided yet.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface/70">
                      <span>Location: {role.location ?? 'Flexible'}</span>
                      <span>Time: {role.timeCommitment ?? 'Flexible'}</span>
                    </div>
                    <Button asChild>
                      <Link href={`/volunteer/${role.slug}`}>View role & apply</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-outline/20 bg-surface">
              <CardHeader>
                <CardTitle className="text-lg">No open roles right now</CardTitle>
                <CardDescription>
                  We still want to hear from you. Email outreach@iharc.ca and we will reach out when new roles are posted.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <Card className="border-outline/20 bg-surface">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">What to expect</CardTitle>
            <CardDescription>Our recruitment team reviews every application with care.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-on-surface/80">
            <p>
              Roles are coordinated through the IHARC portal (STEVI). Once you apply, our team will follow up to confirm availability, training, and next steps.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>We prioritize community-first, trauma-informed support.</li>
              <li>Training and orientation are provided before shifts begin.</li>
              <li>Volunteer schedules are built with your capacity in mind.</li>
            </ul>
            <Button asChild variant="outline">
              <Link href="mailto:outreach@iharc.ca">Contact the team</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
