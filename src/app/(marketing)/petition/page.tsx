import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

const PETITION_CANONICAL_PATH = '/petition';
const PETITION_DESCRIPTION =
  'Add your name to the public petition calling on the Town of Cobourg to declare a municipal State of Emergency over housing instability and the toxic drug crisis.';

export const dynamic = 'force-dynamic';

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
        url: '/logo.png',
        alt: 'IHARC — Integrated Homelessness and Addictions Response Centre',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support the declaration — IHARC',
    description: PETITION_DESCRIPTION,
    images: ['/logo.png'],
  },
};

const PETITION_PORTAL_PATH = '/portal/petition/state-of-emergency';

export default function PetitionPage() {
  redirect(PETITION_PORTAL_PATH);
}
