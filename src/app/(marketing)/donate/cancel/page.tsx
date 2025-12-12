import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Donation cancelled — IHARC',
  description: 'Your donation checkout was cancelled.',
};

export default function DonateCancelPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Donate</p>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">Checkout cancelled</h1>
        <p className="text-sm text-on-surface-variant">
          No payment was processed. You can return to the donate page any time.
        </p>
      </header>

      <Card className="border-outline-variant bg-surface-container-high">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-on-surface-variant" aria-hidden />
            Nothing was charged
          </CardTitle>
          <CardDescription>
            If you ran into an issue, try again or email donations@iharc.ca and we will help.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild>
            <Link href="/donate">
              Return to donate <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:donations@iharc.ca">Email donations@iharc.ca</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

