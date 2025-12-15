import type { Metadata } from 'next';
import { getDonationCatalog } from '@/data/donation-catalog';
import { DonateClient } from './donate-client';

export const metadata: Metadata = {
  title: 'Donate to IHARC — Integrated Homelessness and Addictions Response Centre',
  description:
    'Make a one-time or monthly donation to support IHARC outreach. Choose symbolic items from our live inventory-backed catalogue or give a custom amount.',
};

export const revalidate = 60;

export default async function DonatePage() {
  const catalog = await getDonationCatalog();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-5 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Donate</p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
          Fuel the frontline with the items neighbours need most
        </h1>
        <p className="text-base text-on-surface/80 sm:text-lg">
          IHARC outreach teams distribute health, warmth, and nutrition supplies every day. Choose symbolic items from our inventory-backed catalogue, add a custom amount, or set up a monthly donation.
        </p>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant sm:text-base">
          <p className="font-semibold text-on-surface">Receipts & tax note</p>
          <p className="mt-1">
            IHARC is a registered non-profit (not yet a charity). Donation receipts are for record-keeping and are{' '}
            <span className="font-semibold">not tax deductible</span> at this time.
          </p>
        </div>
      </header>

      <DonateClient catalog={catalog} />
    </div>
  );
}
