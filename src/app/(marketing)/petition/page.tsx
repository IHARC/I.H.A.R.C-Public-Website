import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

const PETITION_CANONICAL_PATH = '/petition';
const PETITION_DESCRIPTION =
  'Add your name to the public petition calling on the Town of Cobourg to declare a municipal State of Emergency over housing instability and the toxic drug crisis.';
const PETITION_SOCIAL_IMAGE = '/Petition-image.png';
const PETITION_SOCIAL_ALT = 'IHARC petition call to action with neighbours supporting the declaration.';

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
        url: PETITION_SOCIAL_IMAGE,
        alt: PETITION_SOCIAL_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support the declaration — IHARC',
    description: PETITION_DESCRIPTION,
    images: [PETITION_SOCIAL_IMAGE],
  },
};

const PETITION_PORTAL_PATH = '/portal/petition/state-of-emergency';

export default function PetitionPage() {
  redirect(PETITION_PORTAL_PATH);
}
