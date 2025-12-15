"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
const ONE_TIME_PRESETS = ['10', '25', '50', '100'] as const;
const MONTHLY_PRESETS = ['10', '25', '50', '100'] as const;

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
  const [checkoutState, setCheckoutState] = useState<{
    loading: boolean;
    error: string | null;
    kind: 'one_time' | 'monthly' | null;
  }>({ loading: false, error: null, kind: null });

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
      for (const label of item.categoryLabels ?? []) {
        if (label) set.add(label);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const terms = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    return catalog
      .filter((item) => {
        if (category !== 'all' && !(item.categoryLabels ?? []).includes(category)) return false;
        if (terms.length === 0) return true;
        const haystack = `${item.title} ${item.shortDescription ?? ''} ${(item.categoryLabels ?? []).join(' ')}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
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
    setCheckoutState({ loading: true, error: null, kind: 'one_time' });
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
        kind: 'one_time',
      });
    }
  }

  async function startMonthlyCheckout() {
    setCheckoutState({ loading: true, error: null, kind: 'monthly' });
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
        kind: 'monthly',
      });
    }
  }

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-on-surface">Donate online</h2>
          <p className="text-sm text-on-surface-variant">
            One-time donations can include symbolic items from the catalogue plus a custom amount. Monthly donations are
            amount-only and can be managed any time.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/manage-donation">
            Manage monthly donation <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-on-surface">Choose a donation type</h3>
          <p className="text-sm text-on-surface-variant">
            One-time donations support immediate outreach needs. Monthly donations keep essential supply runs consistent.
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as typeof tab);
            setCheckoutState((prev) => (prev.loading ? prev : { loading: false, error: null, kind: null }));
          }}
          className="mt-6 w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="one_time">One-time</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="one_time" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <aside className="order-first space-y-4 lg:order-last lg:self-start lg:sticky lg:top-24">
                <Card className="border-outline-variant bg-surface">
                  <CardHeader className="space-y-1">
                    <CardTitle>Your one-time donation</CardTitle>
                    <CardDescription>Add symbolic items, enter a custom amount, or donate an amount only.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="custom-amount">Custom amount (optional)</Label>
                      <Input
                        id="custom-amount"
                        inputMode="decimal"
                        placeholder="0"
                        value={customAmount}
                        onChange={(event) => setCustomAmount(event.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {ONE_TIME_PRESETS.map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant={preset === customAmount ? 'default' : 'outline'}
                            onClick={() => setCustomAmount(preset)}
                          >
                            ${preset}
                          </Button>
                        ))}
                        <Button type="button" variant="ghost" onClick={() => setCustomAmount('')}>
                          Clear
                        </Button>
                      </div>
                      <p className="text-xs text-on-surface-variant">Whole-dollar amounts process fastest.</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">
                          Symbolic items {itemCount > 0 ? <span>({itemCount})</span> : null}
                        </span>
                        <span className="font-semibold text-on-surface">
                          {formatMoney(cartSummary.itemsSubtotalCents, cartSummary.currency)}
                        </span>
                      </div>

                      {cartSummary.lines.length === 0 ? (
                        <p className="text-xs text-on-surface-variant">No symbolic items selected yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {cartSummary.lines.map(({ item, quantity }) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
                            >
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
                          ))}
                          <div className="flex justify-end">
                            <Button type="button" variant="ghost" onClick={() => setCart({})}>
                              Clear items
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
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
                        <span className="font-semibold text-on-surface">
                          {formatMoney(cartSummary.totalCents, cartSummary.currency)}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      disabled={checkoutState.loading}
                      onClick={startOneTimeCheckout}
                    >
                      {checkoutState.loading && checkoutState.kind === 'one_time' ? (
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

                    {checkoutState.error && checkoutState.kind === 'one_time' ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-on-surface">
                        {checkoutState.error}
                      </div>
                    ) : null}

                    <p className="text-xs text-on-surface-variant">
                      Checkout is hosted by Stripe. IHARC does not store card numbers.
                    </p>
                  </CardContent>
                </Card>
              </aside>

              <div className="space-y-6">
                <div className="rounded-2xl border border-outline-variant bg-surface p-4 sm:p-6">
                  <div className="grid gap-4 md:grid-cols-12">
                    <div className="space-y-2 md:col-span-6">
                      <Label htmlFor="donation-search">Search catalogue</Label>
                      <Input
                        id="donation-search"
                        placeholder="Search items and categories…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="donation-category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="donation-category">
                          <SelectValue placeholder="All categories" />
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
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="donation-sort">Sort</Label>
                      <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
                        <SelectTrigger id="donation-sort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="most_needed">Most needed</SelectItem>
                          <SelectItem value="priority">Staff priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-on-surface-variant">
                      Showing <span className="font-semibold text-on-surface">{filteredCatalog.length}</span>{' '}
                      {filteredCatalog.length === 1 ? 'item' : 'items'}
                    </span>
                    {query.trim() || category !== 'all' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setQuery('');
                          setCategory('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : null}
                  </div>
                </div>

                {filteredCatalog.length === 0 ? (
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">
                    No catalogue items match your filters.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                      const categoryLabels = item.categoryLabels ?? [];
                      const displayCategories = categoryLabels.slice(0, 2);
                      const moreCategories = categoryLabels.length - displayCategories.length;
                      return (
                        <Card key={item.id} className="border-outline-variant bg-surface">
                          <CardHeader className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {displayCategories.length > 0 ? (
                                  <>
                                    {displayCategories.map((label) => (
                                      <Badge key={label} variant="secondary">
                                        {label}
                                      </Badge>
                                    ))}
                                    {moreCategories > 0 ? <Badge variant="outline">+{moreCategories}</Badge> : null}
                                  </>
                                ) : (
                                  <Badge variant="secondary">Priority item</Badge>
                                )}
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <Card className="border-outline-variant bg-surface">
                <CardHeader className="space-y-2">
                  <CardTitle>Set up a monthly donation</CardTitle>
                  <CardDescription>
                    Monthly donations are amount-only (no symbolic items). You can update payment method or cancel any
                    time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                      <p className="text-xs text-on-surface-variant">Monthly donations must be a whole dollar amount.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Presets</Label>
                      <div className="flex flex-wrap gap-2">
                        {MONTHLY_PRESETS.map((preset) => (
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
                      {checkoutState.loading && checkoutState.kind === 'monthly' ? (
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

                  {checkoutState.error && checkoutState.kind === 'monthly' ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-on-surface">
                      {checkoutState.error}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <aside className="space-y-4 lg:self-start lg:sticky lg:top-24">
                <Card className="border-outline-variant bg-surface-container-low">
                  <CardHeader className="space-y-2">
                    <CardTitle>Already donating monthly?</CardTitle>
                    <CardDescription>
                      Send yourself a secure Stripe Customer Portal link to update payment method or cancel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/manage-donation">
                        Manage monthly donation <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>
        </Tabs>
      </div>

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
