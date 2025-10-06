import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PetitionIndexPage() {
  redirect('/portal/petition/state-of-emergency');
}
