import type { Metadata } from 'next';
import Link from 'next/link';
import { steviPortalUrl } from '@/lib/stevi-portal';

const commitments = [
  'Neighbours shape decisions through their stories and consented feedback, never as data points.',
  'Evidence is shared in plain language and updated as soon as partners publish it.',
  'Decisions acknowledge risks, mitigation steps, and who is accountable for action.',
  'Respectful moderation keeps stigmatizing or punitive ideas from moving forward.',
  'Frontline teams, municipal staff, and people with lived experience review plans together.',
];

const collaborationLoops = [
  {
    title: 'Reach and check in',
    description:
      'Street outreach teams across Northumberland complete wellness checks, respond to safety concerns, and log consented needs in STEVI without publishing identifying details.',
  },
  {
    title: 'Navigate to services',
    description:
      'IHARC coordinators help people connect to shelter, health care, income supports, and transportation. Referrals and appointments are tracked securely in STEVI for participating organizations.',
  },
  {
    title: 'Follow through together',
    description:
      'Updates inside STEVI keep clients and partners aligned on upcoming visits, documents, and what changed so the next support step is clear.',
  },
];

export const metadata: Metadata = {
  title: 'About IHARC — Integrated Homelessness and Addictions Response Centre',
  description:
    'Learn how the Integrated Homelessness and Addictions Response Centre provides frontline outreach and navigation across Northumberland County, and how the secure STEVI portal keeps clients and partners coordinated.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    type: 'website',
    title: 'About IHARC — Integrated Homelessness and Addictions Response Centre',
    description:
      'Learn how the Integrated Homelessness and Addictions Response Centre provides frontline outreach and navigation across Northumberland County, and how the secure STEVI portal keeps clients and partners coordinated.',
    url: '/about',
    images: [
      {
        url: '/logo.png',
        alt: 'IHARC — Integrated Homelessness and Addictions Response Centre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About IHARC — Integrated Homelessness and Addictions Response Centre',
    description:
      'Learn how the Integrated Homelessness and Addictions Response Centre provides frontline outreach and navigation across Northumberland County, and how the secure STEVI portal keeps clients and partners coordinated.',
    images: ['/logo.png'],
  },
};

export default function AboutPage() {
  const steviHomeUrl = steviPortalUrl('/');
  const steviRegisterUrl = steviPortalUrl('/register');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">About IHARC</p>
        <h1 className="text-4xl font-bold tracking-tight">Frontline outreach and navigation across Northumberland</h1>
        <p className="text-base text-on-surface/80">
          IHARC, the Integrated Homelessness and Addictions Response Centre, is a frontline non-profit providing street outreach, safety checks, health and basic supplies, and service navigation with neighbours across Northumberland County. We do not operate shelters, treatment programs, or permanent housing; instead, we help people connect to those services and stay supported while they wait.
        </p>
        <p className="text-sm text-on-surface/70">
          We work across Northumberland County alongside partners in Cobourg, Port Hope, Alderville First Nation, and rural townships.
        </p>
        <p className="text-sm text-on-surface/70">
          STEVI (Supportive Technology to Enable Vulnerable Individuals) is our secure portal for clients and participating organizations to manage services, appointments, and documents. It is invitation-only and not a public ideas forum.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {collaborationLoops.map((loop) => (
          <div key={loop.title} className="rounded-3xl border border-outline/20 bg-surface p-6">
            <h2 className="text-lg font-semibold text-on-surface">{loop.title}</h2>
            <p className="mt-2 text-sm text-on-surface/80">{loop.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What we commit to</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {commitments.map((commitment) => (
            <li key={commitment} className="rounded-2xl border border-outline/10 bg-surface-container p-4 text-sm text-on-surface/80">
              {commitment}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl border border-outline/10 bg-surface p-8">
        <h2 className="text-2xl font-semibold">Need to coordinate care?</h2>
        <p className="text-on-surface/80">
          Sign in to STEVI to review your plan, upload documents, or confirm outreach visits. Request access if you are already working with IHARC or are a partner organization supporting someone who is.
        </p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href={steviHomeUrl}
            prefetch={false}
            className="rounded-full bg-primary px-5 py-2 text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Sign in to STEVI
          </Link>
          <Link
            href={steviRegisterUrl}
            prefetch={false}
            className="rounded-full border border-outline/30 px-5 py-2 text-on-surface transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Request access
          </Link>
        </div>
      </section>
    </div>
  );
}
