import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, HeartHandshake, Loader2 } from 'lucide-react';
import { getDonationCatalog } from '@/data/donation-catalog';

export const metadata: Metadata = {
  title: 'Donate to IHARC — Integrated Homelessness and Addictions Response Centre',
  description:
    'Support IHARC outreach with item-level giving. See what is most needed this month and help us keep critical supplies on hand.',
};

export const revalidate = 600;

function formatCurrency(amountCents: number | null | undefined, currency = 'CAD') {
  const dollars = (amountCents ?? 0) / 100;
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(dollars);
}

export default async function DonatePage() {
  const catalog = await getDonationCatalog();
  const mailtoUrl = 'mailto:outreach@iharc.ca?subject=IHARC%20donation%20support';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-5 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Donate</p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
          Fuel the frontline with the items neighbours need most
        </h1>
        <p className="text-base text-on-surface/80 sm:text-lg">
          IHARC outreach teams distribute medical, warmth, and nutrition supplies every day. This page shows
          live needs from our inventory so you can direct your support where it has the most impact. Payments stay
          secure in STEVI and Supabase; we never collect card details on the marketing site.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={mailtoUrl}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <HeartHandshake className="h-4 w-4" aria-hidden />
            Talk to the team about a donation
          </Link>
          <p className="text-sm text-on-surface/70">
            Prefer to help in another way? Email outreach@iharc.ca and we will coordinate safely.
          </p>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-outline/15 bg-surface p-6 shadow-level-1 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-on-surface">Current catalogue</h2>
            <p className="text-sm text-on-surface/70">
              Pulled from live inventory and outreach distribution logs. Quantities refresh throughout the day.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface/80">
            <span className="inline-flex h-2 w-2 rounded-full bg-success" aria-hidden />
            Live inventory-backed view
          </div>
        </div>

        {catalog.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-outline/20 bg-surface-container-low px-4 py-6 text-sm text-on-surface/80">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            We are loading catalogue items from Supabase. If this message persists, try again in a moment.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {catalog.map((item) => {
              const target = item.targetBuffer ?? undefined;
              const onHand = item.currentStock ?? 0;
              const targetLabel =
                target && target > 0 ? `${onHand} on hand · target ${target}` : `${onHand} on hand`;

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-outline/15 bg-surface-container-low p-5 shadow-level-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {item.category ?? 'Priority item'}
                      </p>
                      <h3 className="text-xl font-semibold text-on-surface">{item.title}</h3>
                      {item.shortDescription ? (
                        <p className="text-sm text-on-surface/80">{item.shortDescription}</p>
                      ) : null}
                    </div>
                    {item.imageUrl ? (
                      <div className="h-16 w-16 overflow-hidden rounded-lg border border-outline/20 bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-on-surface/80 sm:grid-cols-3">
                    <div className="rounded-xl bg-surface/60 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface/60">Typical cost</dt>
                      <dd className="text-base font-semibold text-on-surface">
                        {formatCurrency(item.unitCostCents, item.currency)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-surface/60 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface/60">
                        On-hand vs. target
                      </dt>
                      <dd className="text-base font-semibold text-on-surface">{targetLabel}</dd>
                    </div>
                    <div className="rounded-xl bg-surface/60 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface/60">
                        Distributed (30 days)
                      </dt>
                      <dd className="text-base font-semibold text-on-surface">
                        {item.distributedLast30Days ?? 0} units
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-on-surface/80">
                    <p className="font-semibold text-on-surface">
                      Want to fund this item? We will set up a secure checkout and send you the link.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${mailtoUrl}&body=I%20want%20to%20support%20${encodeURIComponent(item.title)}%20(${encodeURIComponent(item.slug)}).`}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                        Tell IHARC you want to fund this
                      </Link>
                    </div>
                    <p className="text-xs text-on-surface/70">
                      We coordinate through STEVI to keep payment details and impact tracking secure.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
