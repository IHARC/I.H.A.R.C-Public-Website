"use client";

import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Minus, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DonationCatalogItem } from '@/data/donation-catalog';
import { cn } from '@/lib/utils';

type CartLine = {
  catalogItemId: string;
  quantity: number;
};

type Props = {
  catalog: DonationCatalogItem[];
};

const CART_STORAGE_KEY = 'iharc_donation_cart_v1';

function formatMoney(amountCents: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function normalizeMoneyInputToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function computeNeedScore(item: DonationCatalogItem): number {
  const target = item.targetBuffer ?? null;
  const onHand = item.currentStock ?? null;
  if (!target || target <= 0 || onHand === null) return -Infinity;
  const deficit = Math.max(0, target - onHand);
  return deficit / target;
}

export function DonateClient({ catalog }: Props) {
  const [tab, setTab] = useState<'one_time' | 'monthly'>('one_time');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'priority' | 'most_needed'>('most_needed');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customAmount, setCustomAmount] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('25');
  const [checkoutState, setCheckoutState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return;
      const next: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof key !== 'string') continue;
        const qty = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        next[key] = Math.min(99, Math.floor(qty));
      }
      setCart(next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of catalog) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return catalog
      .filter((item) => {
        if (category !== 'all' && item.category !== category) return false;
        if (!trimmed) return true;
        const haystack = `${item.title} ${item.shortDescription ?? ''} ${item.category ?? ''}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .sort((a, b) => {
        if (sort === 'most_needed') {
          const diff = computeNeedScore(b) - computeNeedScore(a);
          if (diff !== 0) return diff;
        }
        return (a.priority ?? 100) - (b.priority ?? 100) || a.title.localeCompare(b.title);
      });
  }, [catalog, category, query, sort]);

  const cartLines = useMemo((): CartLine[] => {
    const lines: CartLine[] = [];
    for (const [catalogItemId, quantity] of Object.entries(cart)) {
      if (!quantity || quantity <= 0) continue;
      lines.push({ catalogItemId, quantity });
    }
    return lines;
  }, [cart]);

  const cartSummary = useMemo(() => {
    const itemsById = new Map(catalog.map((item) => [item.id, item]));
    const lines = cartLines
      .map((line) => {
        const item = itemsById.get(line.catalogItemId);
        return item ? { item, quantity: line.quantity } : null;
      })
      .filter((row): row is { item: DonationCatalogItem; quantity: number } => Boolean(row));
    const currency = lines[0]?.item.currency ?? 'CAD';
    const itemsSubtotalCents = lines.reduce(
      (total, row) => total + Math.max(0, row.item.unitCostCents ?? 0) * row.quantity,
      0,
    );
    const customCents = normalizeMoneyInputToCents(customAmount);
    const customAmountCents = customCents === null ? null : Math.max(0, customCents);
    const totalCents = itemsSubtotalCents + (customAmountCents ?? 0);
    return { lines, currency, itemsSubtotalCents, customAmountCents, totalCents };
  }, [catalog, cartLines, customAmount]);

  const itemCount = useMemo(() => Object.values(cart).reduce((sum, qty) => sum + (qty ?? 0), 0), [cart]);

  function bumpItem(itemId: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[itemId] ?? 0;
      const updated = current + delta;
      if (updated <= 0) {
        delete next[itemId];
        return next;
      }
      next[itemId] = Math.min(99, updated);
      return next;
    });
  }

  async function startOneTimeCheckout() {
    setCheckoutState({ loading: true, error: null });
    try {
      const customAmountCents = normalizeMoneyInputToCents(customAmount);
      if (customAmountCents === null) {
        throw new Error('Enter a valid custom amount.');
      }
      if (cartLines.length === 0 && customAmountCents <= 0) {
        throw new Error('Add an item to your cart or enter a custom amount.');
      }

      const response = await fetch('/api/donations/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartLines, customAmountCents }),
      });

      const payload = (await response.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'Unable to start checkout.';
        throw new Error(message);
      }

      const url = payload?.url;
      if (typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('Checkout did not return a redirect URL.');
      }

      window.location.assign(url);
    } catch (error) {
      setCheckoutState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to start checkout.',
      });
    }
  }

  async function startMonthlyCheckout() {
    setCheckoutState({ loading: true, error: null });
    try {
      const cents = normalizeMoneyInputToCents(monthlyAmount);
      if (cents === null || cents <= 0) {
        throw new Error('Enter a valid monthly amount.');
      }
      if (cents % 100 !== 0) {
        throw new Error('Monthly donations must be a whole dollar amount.');
      }

      const response = await fetch('/api/donations/create-subscription-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyAmountCents: cents }),
      });

      const payload = (await response.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'Unable to start checkout.';
        throw new Error(message);
      }

      const url = payload?.url;
      if (typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('Checkout did not return a redirect URL.');
      }

      window.location.assign(url);
    } catch (error) {
      setCheckoutState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to start checkout.',
      });
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-on-surface">Donate online</h2>
          <p className="text-sm text-on-surface-variant">
            One-time donations can include symbolic items from the catalogue plus a custom amount. Monthly donations are
            amount-only and can be managed any time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Cart
                <Badge variant="secondary" className="ml-1">
                  {itemCount}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Your donation</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {cartSummary.lines.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No symbolic items yet.</p>
                ) : (
                  <div className="space-y-3">
                    {cartSummary.lines.map(({ item, quantity }) => (
                      <div key={item.id} className="rounded-lg border border-outline-variant bg-surface p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                            <p className="text-xs text-on-surface-variant">
                              {item.unitCostCents ? formatMoney(item.unitCostCents, item.currency) : 'Custom'}
                              {item.category ? ` · ${item.category}` : null}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => bumpItem(item.id, -1)}
                              aria-label={`Decrease quantity for ${item.title}`}
                            >
                              <Minus className="h-4 w-4" aria-hidden />
                            </Button>
                            <span className="min-w-8 text-center text-sm font-semibold text-on-surface">{quantity}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => bumpItem(item.id, +1)}
                              aria-label={`Increase quantity for ${item.title}`}
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Add a custom amount (optional)</Label>
                  <Input
                    id="custom-amount"
                    inputMode="decimal"
                    placeholder="0"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                  />
                  <p className="text-xs text-on-surface-variant">
                    Use whole-dollar amounts for the fastest processing.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Symbolic items</span>
                    <span className="font-semibold text-on-surface">
                      {formatMoney(cartSummary.itemsSubtotalCents, cartSummary.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Custom amount</span>
                    <span className="font-semibold text-on-surface">
                      {cartSummary.customAmountCents === null
                        ? '—'
                        : formatMoney(cartSummary.customAmountCents, cartSummary.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold text-on-surface">Total</span>
                    <span className="font-semibold text-on-surface">{formatMoney(cartSummary.totalCents, cartSummary.currency)}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={checkoutState.loading}
                  onClick={startOneTimeCheckout}
                >
                  {checkoutState.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      Continue to secure checkout
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>

                {checkoutState.error ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-on-surface">
                    {checkoutState.error}
                  </div>
                ) : null}

                <p className="text-xs text-on-surface-variant">
                  Checkout is hosted by Stripe. IHARC does not store card numbers.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="border-outline-variant bg-surface-container-high">
        <CardHeader className="space-y-2">
          <CardTitle>Choose a donation type</CardTitle>
          <CardDescription>
            One-time donations support immediate outreach needs. Monthly donations keep essential supply runs consistent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one_time">One-time</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="one_time" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="donation-search">Search catalogue</Label>
                  <Input
                    id="donation-search"
                    placeholder="Search items and categories…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Filter</Label>
                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="most_needed">Most needed</SelectItem>
                        <SelectItem value="priority">Staff priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {filteredCatalog.length === 0 ? (
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">
                  No catalogue items match your filters.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredCatalog.map((item) => {
                    const target = item.targetBuffer ?? null;
                    const onHand = item.currentStock ?? 0;
                    const needScore = computeNeedScore(item);
                    const needsLabel =
                      needScore === -Infinity
                        ? null
                        : needScore >= 0.5
                          ? 'Most needed'
                          : needScore >= 0.25
                            ? 'Needed'
                            : 'In stock';

                    const qty = cart[item.id] ?? 0;
                    return (
                      <Card key={item.id} className="border-outline-variant bg-surface">
                        <CardHeader className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{item.category ?? 'Priority item'}</Badge>
                              {needsLabel ? (
                                <Badge
                                  variant={needsLabel === 'Most needed' ? 'destructive' : 'outline'}
                                  className={cn(needsLabel === 'In stock' ? 'text-on-surface-variant' : undefined)}
                                >
                                  {needsLabel}
                                </Badge>
                              ) : null}
                            </div>
                            {item.unitCostCents ? (
                              <span className="text-sm font-semibold text-on-surface">
                                {formatMoney(item.unitCostCents, item.currency)}
                              </span>
                            ) : null}
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          {item.shortDescription ? (
                            <CardDescription className="text-sm text-on-surface-variant">
                              {item.shortDescription}
                            </CardDescription>
                          ) : null}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-xs text-on-surface-variant sm:grid-cols-3">
                            <div className="rounded-lg bg-surface-container-low p-3">
                              <p className="font-semibold text-on-surface">On hand</p>
                              <p>{onHand}</p>
                            </div>
                            <div className="rounded-lg bg-surface-container-low p-3">
                              <p className="font-semibold text-on-surface">Target</p>
                              <p>{target ?? '—'}</p>
                            </div>
                            <div className="rounded-lg bg-surface-container-low p-3">
                              <p className="font-semibold text-on-surface">30 days</p>
                              <p>{item.distributedLast30Days ?? 0} distributed</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                              Qty in cart: <span className="text-on-surface">{qty}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => bumpItem(item.id, -1)}
                                disabled={qty <= 0}
                                aria-label={`Remove one ${item.title}`}
                              >
                                <Minus className="h-4 w-4" aria-hidden />
                              </Button>
                              <Button type="button" onClick={() => bumpItem(item.id, +1)}>
                                Add to cart
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => bumpItem(item.id, +1)}
                                aria-label={`Add one more ${item.title}`}
                              >
                                <Plus className="h-4 w-4" aria-hidden />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="mt-6 space-y-6">
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
                Monthly donations are amount-only (no symbolic items). You can manage or cancel your monthly donation
                any time using the “Manage donation” link on the success page.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthly-amount">Monthly amount</Label>
                  <Input
                    id="monthly-amount"
                    inputMode="decimal"
                    placeholder="25"
                    value={monthlyAmount}
                    onChange={(event) => setMonthlyAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {['10', '25', '50', '100'].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={preset === monthlyAmount ? 'default' : 'outline'}
                        onClick={() => setMonthlyAmount(preset)}
                      >
                        ${preset}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-on-surface-variant">
                  You will be redirected to Stripe Checkout to set up your monthly donation.
                </div>
                <Button type="button" disabled={checkoutState.loading} onClick={startMonthlyCheckout}>
                  {checkoutState.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      Continue to secure checkout
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>
              </div>

              {checkoutState.error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-on-surface">
                  {checkoutState.error}
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
        <p className="font-semibold text-on-surface">Need a different way to give?</p>
        <p className="mt-1">
          Email{' '}
          <a href="mailto:donations@iharc.ca" className="font-semibold text-primary underline">
            donations@iharc.ca
          </a>{' '}
          and we will coordinate safely.
        </p>
      </div>
    </section>
  );
}
