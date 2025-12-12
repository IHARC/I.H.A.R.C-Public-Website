import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ManageDonationPortalPage({ searchParams }: { searchParams?: SearchParams }) {
  const resolved = (await searchParams) ?? {};
  const tokenParam = resolved.token;
  const token = typeof tokenParam === 'string' ? tokenParam : null;
  if (!token) {
    redirect('/manage-donation');
  }

  const supabase = getSupabasePublicClient();
  const response = await supabase.functions.invoke('donations_create_portal_session', {
    body: { token },
  });

  const url = (response.data as { url?: unknown } | null)?.url;
  if (response.error || typeof url !== 'string' || !url.startsWith('http')) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16 text-on-surface sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Manage donation</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">This link is no longer valid</h1>
          <p className="text-sm text-on-surface-variant">
            Manage links expire quickly for safety. Request a new link and we’ll email it to you.
          </p>
        </header>

        <Card className="border-outline-variant bg-surface-container-high">
          <CardHeader>
            <CardTitle>Request a new link</CardTitle>
            <CardDescription>We’ll send a time-limited link to Stripe’s Customer Portal.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild>
              <Link href="/manage-donation">Go to manage donation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/donate">Return to donate</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect(url);
}
