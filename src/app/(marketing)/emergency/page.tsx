import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State of Emergency Brief — IHARC',
  description:
    'Understand why Northumberland partners declared a housing and overdose emergency, what the declaration enables, and how to share your support.',
};

const PETITION_PORTAL_PATH = '/portal/petition/state-of-emergency';

export default function EmergencyBriefPage() {
  redirect(PETITION_PORTAL_PATH);
}
