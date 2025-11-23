import type { Metadata } from 'next';
import Link from 'next/link';
import { getSupportEntries } from '@/data/marketing-content';
import { steviPortalUrl } from '@/lib/stevi-portal';

export const metadata: Metadata = {
  title: 'Get Help Now — IHARC',
  description:
    'Find immediate housing, health, and overdose prevention supports across Northumberland County. Contact information is provided without collecting personal data.',
};

export default async function GetHelpPage() {
  const { urgent, mutualAid } = await getSupportEntries();
  const steviHomeUrl = steviPortalUrl('/');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Get Help Now</p>
        <h1 className="text-4xl font-bold tracking-tight">Support is coordinated, compassionate, and available</h1>
        <p className="text-base text-on-surface/80">
          No one using this list needs to share personal details publicly. Contact teams directly and let them know how to reach you safely. Moderators refresh this page whenever hours or contacts change.
        </p>
      </header>

      <section className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive-foreground">
        <p>
          <strong>In an emergency call 911.</strong> Tell dispatch if drugs are involved so responders bring naloxone. You are protected from simple possession charges under the Good Samaritan Drug Overdose Act.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {urgent.map((support) => (
          <article key={support.title} className="rounded-3xl border border-outline/10 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface">{support.title}</h2>
            <p className="mt-2 text-sm text-on-surface/80 whitespace-pre-line">{support.body}</p>
            <div className="mt-4 space-y-1 text-sm font-semibold text-primary">
              {support.contacts.map((contact) =>
                contact.href ? (
                  <p key={`${support.title}-${contact.label}`}>
                    <Link href={contact.href} className="underline">
                      {contact.label}
                    </Link>
                  </p>
                ) : (
                  <p key={`${support.title}-${contact.label}`}>{contact.label}</p>
                ),
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-outline/20 bg-surface-container p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">Community-led mutual aid</h2>
        <ul className="mt-4 space-y-3">
          {mutualAid.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4">
          Want to add a community resource? Email
          {' '}
          <Link href="mailto:portal@iharc.ca" className="font-semibold text-primary underline">
            portal@iharc.ca
          </Link>
          {' '}with details and we will follow up within one business day.
        </p>
      </section>

      <section className="rounded-3xl border border-outline/10 bg-surface p-8 text-sm text-on-surface/80">
        <h2 className="text-2xl font-semibold text-on-surface">When to use STEVI</h2>
        <p className="mt-2">
          STEVI (stevi.iharc.ca) is the secure IHARC portal for neighbours already working with outreach teams. Use it to request appointments, share updates, download letters, and see upcoming visits without repeating your story.
        </p>
        <Link
          href={steviHomeUrl}
          prefetch={false}
          className="mt-4 inline-flex w-fit rounded-full border border-outline/30 px-5 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Open STEVI
        </Link>
      </section>
    </div>
  );
}
