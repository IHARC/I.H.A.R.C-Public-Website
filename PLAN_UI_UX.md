# IHARC Public Website: UI/UX + Compliance Living Plan

Repo: `/home/jordan/github/I.H.A.R.C-Public-Website`  
Last updated: 2026-01-31  
Owner: TBD

## Purpose

Keep a single, continuously updated plan for improving iharc.ca so it stays:
- Get-help-first (primary user journey).
- Accessible (WCAG 2.1 AA).
- Modern, responsive, and scalable for new features (data, resources, donations, volunteer flows).
- Aligned with IHARC context (strengths-based, trauma-informed, privacy-respecting, community-first).

## Locked decisions (current)

- Primary UX goal: **Get Help first** (homepage + global navigation).
- Accessibility/compliance target: **WCAG 2.1 AA**.
- Scope: **Incremental UX polish** (no major redesign).

## How to use this plan

- Update **checkboxes**, **notes**, and **acceptance criteria** as work lands.
- Prefer **removing dead/legacy code** over keeping fallbacks or compatibility shims.
- Keep “Get Help” copy and contact info within repo guardrails (see `AGENTS.md`).

## Workstream A: Tooling + Quality Gates (must be green)

### A1. Fix Playwright running Vitest specs

Status: [ ] Not started  [ ] In progress  [x] Done

Problem:
- Playwright currently picks up Vitest `*.spec.ts` files under `tests/`, causing matcher collisions and import errors.

Implementation:
- Update `playwright.config.ts`:
  - `testMatch: ['**/*.e2e.spec.ts']`
  - (Optional) `testIgnore: ['**/*.lib.spec.ts', '**/units.spec.ts']`
- Rename Playwright tests to `*.e2e.spec.ts`:
  - `tests/smoke.spec.ts` -> `tests/smoke.e2e.spec.ts` (rewrite assertions; current file is stale).
- Ensure PIT unit test does NOT run in Playwright:
  - Rename `tests/pit/public.spec.ts` -> `tests/pit/public.lib.spec.ts` (Vitest unit test).

Acceptance:
- `npm run e2e` runs only Playwright tests.
- No Vitest-related errors appear during Playwright runs.

Files:
- `playwright.config.ts`
- `tests/smoke.spec.ts` (rename -> `tests/smoke.e2e.spec.ts`)
- `tests/pit/public.spec.ts` (rename -> `tests/pit/public.lib.spec.ts`)

### A2. Fix preview command for standalone output

Status: [ ] Not started  [ ] In progress  [x] Done

Problem:
- `next start` warns it does not work with `output: 'standalone'`.

Implementation:
- Update `package.json`:
  - `"preview": "node .next/standalone/server.js -p 4321"`
- Keep Playwright `webServer.command` as `npm run preview`.

Acceptance:
- `npm run build` then `npm run preview` starts without Next.js standalone warnings.
- `npm run e2e` can boot the preview server reliably.

Files:
- `package.json`
- `playwright.config.ts`

## Workstream B: Navigation + IA (Get Help first)

### B1. Header: add “Get help” as a first-class CTA (desktop + mobile)

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- In `src/components/layout/top-nav.tsx`:
  - Add Get Help CTA (`href="/get-help"`) and make it the primary CTA.
  - Reorder existing CTAs so Get Help is first on desktop and in mobile quick actions.

Acceptance:
- “Get help” is one-click accessible from every page on desktop and mobile.
- Keyboard focus order is logical and focus styles are visible.

Files:
- `src/components/layout/top-nav.tsx`

### B2. Footer: add help + policy links

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Update `src/components/SiteFooter.tsx` footer nav to include:
  - `/get-help`
  - `/policies`
  - keep `/resources`, `/donate`

Acceptance:
- Footer provides “Help” and “Policies” access without hunting.

Files:
- `src/components/SiteFooter.tsx`

## Workstream C: Crisis/Safety Messaging Consistency

### C1. Add reusable CrisisNotice component

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Add `src/components/site/CrisisNotice.tsx`:
  - `export function CrisisNotice(props: { variant?: 'banner' | 'card'; className?: string }): JSX.Element`
  - Must include: “In an emergency call 911.”
  - Use semantic markup; avoid `role="alert"` unless necessary.

Replace duplicated callouts in:
- `src/app/(marketing)/get-help/page.tsx`
- `src/app/(marketing)/data/page.tsx`
- `src/app/(marketing)/myth-busting/page.tsx`
- Optional: `src/app/(marketing)/page.tsx`

Acceptance:
- Crisis copy is consistent across pages; no divergent emergency language.

Files:
- `src/components/site/CrisisNotice.tsx`
- `src/app/(marketing)/get-help/page.tsx`
- `src/app/(marketing)/data/page.tsx`
- `src/app/(marketing)/myth-busting/page.tsx`
- `src/app/(marketing)/page.tsx`

### C2. Enforce Get Help contact guardrails in CMS-driven data

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- In `src/data/marketing-content.ts`:
  - Add allowlist + validation for `marketing.supports.urgent` contacts.
  - Normalize `tel:` and `mailto:` before comparing.
  - Throw hard errors if unapproved contacts appear (no silent fallbacks).
- Update `src/app/(marketing)/get-help/page.tsx`:
  - “Want to add a community resource?” email must be `outreach@iharc.ca` (per guardrails).
- Add unit tests to prove the validator:
  - Expand `vitest.config.ts` include patterns to pick up the new test file.
  - Add `tests/marketing-content.validation.test.ts` (or similar) for allowlist behavior.

Acceptance:
- Unapproved contact values fail fast at runtime and are covered by unit tests.

Files:
- `src/data/marketing-content.ts`
- `src/app/(marketing)/get-help/page.tsx`
- `vitest.config.ts`
- `tests/marketing-content.validation.test.ts`

## Workstream D: Homepage (Get Help first)

### D1. Move “Need support right now?” earlier and add Get Help CTA

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Update `src/app/(marketing)/page.tsx`:
  - Place the support section immediately after the hero.
  - Include an explicit CTA button linking to `/get-help`.
  - Keep STEVI messaging, but position it as secure portal for already-connected users.

Acceptance:
- On mobile, users see an obvious “Get help” path within the first 1-2 scroll lengths.

Files:
- `src/app/(marketing)/page.tsx`

## Workstream E: Copy Consistency (Canada-first)

### E1. Standardize spelling: “neighbours” (not “neighbors”)

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Replace “neighbors” -> “neighbours” across marketing pages/components.

Acceptance:
- No “neighbors” remains in marketing copy.

## Workstream F: Metadata + Structured Data

### F1. Align homepage metadata with site-wide guardrails

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Align or remove `export const metadata` in `src/app/(marketing)/page.tsx` so it matches the locked site-wide title/description in `src/app/layout.tsx`.

Acceptance:
- Homepage title/description match guardrails.

Files:
- `src/app/(marketing)/page.tsx`
- `src/app/layout.tsx` (only if centralizing shared metadata)

### F2. Add global Organization + WebSite JSON-LD

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Add a JSON-LD `<script type="application/ld+json">` in `src/app/layout.tsx` describing:
  - IHARC Organization
  - iharc.ca WebSite

Acceptance:
- Global structured data exists without duplicating/contradicting per-page JSON-LD.

Files:
- `src/app/layout.tsx`

## Workstream G: Security Headers (Best Practice)

### G1. Add HSTS + CSP

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Extend `next.config.mjs` `headers()` to include:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - A tight `Content-Security-Policy` allowlisting only what is actually used:
    - GA4 (`www.googletagmanager.com`, `www.google-analytics.com`)
    - Stripe (`js.stripe.com`, `checkout.stripe.com`, etc.)
    - Supabase (`*.supabase.co`)
    - Resource embed hosts (e.g., `docs.google.com`, any real video hosts in use)
- No wildcard `*`. If something breaks, update allowlists deliberately.

Acceptance:
- Site functions normally (donations/resources embeds/analytics) under CSP.
- Security headers present in deployed environment as well (Azure Static Web Apps config if needed).

Files:
- `next.config.mjs`
- `staticwebapp.config.json` (if present/needed for prod header parity)

## Workstream H: Automated Accessibility Testing

### H1. Add Axe scanning on critical routes

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Add `@axe-core/playwright` and create `tests/a11y.e2e.spec.ts` scanning:
  - `/`, `/get-help`, `/stats`, `/resources`, `/donate`
- Fail on serious/critical violations (at minimum).

Acceptance:
- CI blocks regressions; scan is stable and not flaky.

Files:
- `package.json`
- `tests/a11y.e2e.spec.ts`

## Workstream I: Remove Dead/Legacy Code

### I1. Delete unused `src/data/site.ts` (if confirmed unused)

Status: [ ] Not started  [ ] In progress  [x] Done

Implementation:
- Confirm it has no imports/references.
- Delete file if unused (it contains placeholder contacts and non-existent routes).

Acceptance:
- No unused placeholder content remains.

Files:
- `src/data/site.ts`

## Required commands (local/CI)

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run e2e`
