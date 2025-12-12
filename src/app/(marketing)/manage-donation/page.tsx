import type { Metadata } from 'next';
import { ManageDonationClient } from './manage-donation-client';

export const metadata: Metadata = {
  title: 'Manage donation — IHARC',
  description: 'Manage your monthly donation safely through Stripe.',
};

export default function ManageDonationPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-3 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Manage donation</p>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          Manage a monthly donation
        </h1>
        <p className="text-sm text-on-surface-variant">
          Enter the email you used in Stripe Checkout. If we find an active monthly donation, we’ll email you a secure
          link to manage it.
        </p>
      </header>

      <ManageDonationClient />
    </div>
  );
}

