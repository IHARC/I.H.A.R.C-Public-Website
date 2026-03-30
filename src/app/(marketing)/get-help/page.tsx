import type { Metadata } from 'next';
import Link from 'next/link';
import { getSupportEntries } from '@/data/marketing-content';
import { steviPortalUrl } from '@/lib/stevi-portal';
import { CrisisNotice } from '@/components/site/CrisisNotice';
import { buildMarketingMetadata } from '@/lib/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildMarketingMetadata({
    title: 'Get Help Now — IHARC',
    description:
      'Find immediate housing, health, and overdose prevention supports across Northumberland County. Contact information is provided without collecting personal data.',
    path: '/get-help',
  });
}

export default async function GetHelpPage() {
  const { urgent, mutualAid } = await getSupportEntries();
  const steviHomeUrl = steviPortalUrl('/');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <div className="space-y-14">
        <header className="grid gap-8 border-b border-outline/12 pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
          <div className="max-w-3xl space-y-5 text-balance">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Get Help Now</p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Support is coordinated, compassionate, and available right now.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface/78">
              No one using this page needs to share personal details publicly. Contact teams directly,
              tell them how to reach you safely, and start with the support that matches what is urgent.
            </p>
          </div>
          <div className="space-y-4 border-t border-outline/12 pt-6 text-sm leading-7 text-on-surface/72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p>
              IHARC keeps this list focused so it stays usable under pressure. Verified local crisis and
              outreach contacts come first.
            </p>
            <p>
              STEVI is not required to reach any of the public supports below. It is only for secure
              follow-through once someone is already working with IHARC or a partner team.
            </p>
          </div>
        </header>

        <CrisisNotice />

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Urgent supports</p>
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em]">
              Start with the fastest path to the right team.
            </h2>
          </div>
          <div className="divide-y divide-outline/12 border-y border-outline/12">
            {urgent.map((support, index) => (
              <article key={support.title} className="grid gap-4 py-6 md:grid-cols-[4rem_minmax(0,1fr)_minmax(14rem,18rem)] md:items-start">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/72">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <div className="space-y-3">
                  <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-on-surface">
                    {support.title}
                  </h2>
                  <p className="text-sm leading-7 text-on-surface/78">{support.summary}</p>
                  <p className="text-sm leading-7 text-on-surface/68 whitespace-pre-line">{support.body}</p>
                </div>
                <div className="space-y-2 text-sm font-semibold text-primary">
                  {support.contacts.map((contact) =>
                    contact.href ? (
                      <p key={`${support.title}-${contact.label}`}>
                        <Link
                          href={contact.href}
                          className="inline-flex min-h-[44px] items-center rounded-full border border-outline/20 px-4 py-2 transition hover:border-primary/30 hover:bg-primary/6 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {contact.label}
                        </Link>
                      </p>
                    ) : (
                      <p key={`${support.title}-${contact.label}`} className="text-on-surface/72">
                        {contact.label}
                      </p>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-[2rem] bg-surface-container-low px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Community mutual aid</p>
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-on-surface">
              Practical reminders that help neighbours respond safely.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-on-surface/76">
            <ul className="space-y-3">
              {mutualAid.map((item) => (
                <li key={item} className="border-t border-outline/12 pt-3 first:border-t-0 first:pt-0">
                  {item}
                </li>
              ))}
            </ul>
            <p>
              Want to add a community resource? Email{' '}
              <Link href="mailto:outreach@iharc.ca" className="support-link">
                outreach@iharc.ca
              </Link>{' '}
              with details and IHARC will follow up within one business day.
            </p>
          </div>
        </section>

        <section className="grid gap-6 border-t border-outline/12 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">When to use STEVI</p>
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-on-surface">
              Already working with IHARC or an approved partner team?
            </h2>
            <p className="text-sm leading-7 text-on-surface/74">
              STEVI is the secure IHARC workspace for appointments, documents, updates, and role-based
              coordination. It is for active follow-through, not for first contact or crisis support.
            </p>
          </div>
          <Link
            href={steviHomeUrl}
            prefetch={false}
            className="inline-flex min-h-11 w-fit items-center rounded-full border border-outline/25 px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            STEVI Login
          </Link>
        </section>
      </div>
    </div>
  );
}
