# Donation Catalogue “Live Needs” Plan (iharc.ca + STEVI)

This file captures the cross-app implementation plan for making the public donation catalogue feel inventory-backed (needs-first), while keeping all catalogue configuration and inventory operations in **STEVI**.

For the same plan in the admin repo context, see: `STEVI/docs/donation-catalog-needs-plan.md`.

## Goals
- Show live “need” on iharc.ca using inventory stock counts.
- Default browse experience: “Most needed” and “Needed only”.
- Enable “Fill the gap” (quickly donate toward shortages).
- Ensure STEVI admin + inventory updates propagate quickly to iharc.ca (cache revalidation).

## Existing building blocks (already implemented)
- Public site reads `portal.donation_catalog_public` via `src/data/donation-catalog.ts`.
- Public site donate UI supports:
  - One-time donations with custom amount
  - Monthly donation checkout
  - Catalogue filters (category + sort)
- STEVI already manages donation catalogue items, categories, activation gating, and Stripe sync.
- Supabase already exposes:
  - `donations.catalog_item_metrics` (inventory-derived metrics)
  - `portal.donation_catalog_public` (public view with metrics + category arrays)

## Public “Needs” UX (iharc.ca)
### Derived metrics (computed from the public view fields)
- `shortBy = max(0, targetBuffer - currentStock)` when both exist
- `needPct = shortBy / targetBuffer` when `targetBuffer > 0`
- `burnRatePerDay = distributedLast30Days / 30` when available
- Optional `daysOfStock = currentStock / burnRatePerDay` when `burnRatePerDay > 0`

### Behaviour
- Default filter: **Needed only** (ON)
  - Show items with `shortBy > 0` and valid buffers
  - Provide “Show all” toggle to browse full catalogue
- Default sort: **Most needed**
  - `needPct` desc → `shortBy` desc → `burnRatePerDay` desc → `priority` asc → `title`
- Per card:
  - Progress bar “On hand / Target”
  - “Short by X” badge
  - “Fill the gap” button setting cart quantity to `min(shortBy, cap)`
- Categories:
  - Render as chips keyed by `category_slugs` (labels are display-only).

## Data/view considerations
`portal.donation_catalog_public` already contains: `target_buffer`, `current_stock`, `distributed_last_30_days`, and category arrays.

Optional improvements (only if desired, may require view updates):
- Add `catalog_updated_at` and/or `stock_updated_at` for “Updated recently” messaging.
- Add a public categories view (ordered chips) if we want category chip order to respect admin `sort_order`.

## Cache revalidation (required for “live” feel)
The marketing site caches the donation catalogue by tag (`marketing:donation-catalog`).

Plan:
- Add a secure marketing route handler `POST /api/revalidate/donation-catalog` that calls `invalidateDonationCatalog()`.
- Have STEVI call this endpoint after:
  - donation catalogue edits (save listing, category changes, stripe sync)
  - inventory stock mutations (receive/adjust/transfer)

Environment:
- Marketing: `MARKETING_REVALIDATE_SECRET`
- STEVI: `MARKETING_REVALIDATE_DONATION_CATALOG_URL`, `MARKETING_REVALIDATE_SECRET` (must match)

## Delivery phases
- Phase 1: iharc.ca UI updates (needed-only, fill-the-gap, progress/shortfall, improved sorting).
- Phase 2: STEVI UX enhancements (preview + “shortBy/need%” columns for staff).
- Phase 3: Cross-app revalidation plumbing.
- Phase 4: Tests + validation + rollout.
