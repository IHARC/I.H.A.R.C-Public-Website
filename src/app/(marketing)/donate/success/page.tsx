import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';

export const metadata: Metadata = {
  title: 'Donation complete — IHARC',
  description: 'Thank you for supporting IHARC outreach.',
};

type SuccessResult = {
  mode: 'payment' | 'subscription';
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required' | 'unknown';
  amountTotalCents: number | null;
  currency: string | null;
};

function formatMoney(amountCents: number | null, currency = 'CAD') {
  if (!amountCents || amountCents <= 0) return null;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export default async function DonateSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const sessionIdParam = params.session_id;
  const sessionId = typeof sessionIdParam === 'string' ? sessionIdParam : null;
  if (!sessionId) {
    redirect('/donate');
  }

  const supabase = getSupabasePublicClient();
  const response = await supabase.functions.invoke('donations_get_checkout_status', {
    body: { sessionId },
  });

  const result = (response.data ?? null) as SuccessResult | null;
  const hasValidMode = result?.mode === 'payment' || result?.mode === 'subscription';
  const currency = typeof result?.currency === 'string' ? result.currency : null;
  const amountLabel = currency ? formatMoney(result?.amountTotalCents ?? null, currency) : null;

  if (response.error || !result || !hasValidMode) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Donate</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">Thanks for your support</h1>
          <p className="text-sm text-on-surface-variant">
            We couldn’t confirm your donation status right now. If your payment completed, Stripe will send a confirmation and IHARC will email a receipt.
          </p>
        </header>

        <Card className="border-outline-variant bg-surface-container-high">
          <CardHeader className="space-y-2">
            <CardTitle>Confirmation pending</CardTitle>
            <CardDescription>
              If you closed the checkout window early, your donation may not have completed. You can try again or contact us.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Questions? Email{' '}
              <a href="mailto:donations@iharc.ca" className="font-semibold text-primary underline">
                donations@iharc.ca
              </a>
              .
            </p>
            <Button asChild variant="outline">
              <Link href="/donate">
                Return to donate <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mode = result.mode;
  const paymentStatus = result.paymentStatus;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Donate</p>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          Thank you for supporting IHARC
        </h1>
        <p className="text-sm text-on-surface-variant">
          Your donation helps outreach teams keep critical supplies on hand and respond quickly across Northumberland County.
        </p>
      </header>

      <Card className="border-outline-variant bg-surface-container-high">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
            Donation received
          </CardTitle>
          <CardDescription>
            {paymentStatus === 'paid'
              ? 'Stripe confirmed your payment.'
              : 'If you closed the checkout window early, your donation may not have completed.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface">Receipt note</p>
            <p className="mt-1">
              IHARC is a registered non-profit (not yet a charity). Receipts are for record-keeping and are{' '}
              <span className="font-semibold">not tax deductible</span> at this time.
            </p>
          </div>

          {amountLabel ? (
            <p className="text-sm text-on-surface-variant">
              Confirmed amount: <span className="font-semibold text-on-surface">{amountLabel}</span>
            </p>
          ) : null}

          {mode === 'subscription' ? (
            <div className="space-y-2">
              <p className="text-sm text-on-surface-variant">
                You can update payment method or cancel your monthly donation at any time.
              </p>
              <Button asChild>
                <Link href="/manage-donation">
                  Manage monthly donation <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-on-surface-variant">
                Questions or corrections? Email{' '}
                <a href="mailto:donations@iharc.ca" className="font-semibold text-primary underline">
                  donations@iharc.ca
                </a>
                .
              </p>
              <Button asChild variant="outline">
                <Link href="/donate">
                  Make another donation <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
