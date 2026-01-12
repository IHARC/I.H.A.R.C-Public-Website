## Mission & Audience Context
- This repository now powers the public-facing IHARC marketing site. It tells the Integrated Homelessness and Addictions Response Centre (IHARC) story, surfaces trusted data, and points visitors to STEVI (Supportive Technology to Enable Vulnerable Individuals) for all secure collaboration.
- Content must emphasise collaboration, dignity, and community care. Avoid deficit framing and maintain trust with neighbours, agency partners, and local government.
- Use the full organization name — **Integrated Homelessness and Addictions Response Centre** — in formal copy, metadata, and footers. STEVI should always be described as the secure IHARC portal for clients, staff, volunteers, and community partners.
- Every iteration should (1) keep real-time housing/overdose metrics easy to scan and (2) make it obvious that deeper collaboration now happens inside STEVI.

### Marketing Content Guardrails
- **Get Help** must list verified numbers only: 2-1-1, Transition House coordinated entry **905-376-9562**, 9-8-8, and NHH Community Mental Health Services **905-377-9891**. The IHARC text line is offline; direct people to `outreach@iharc.ca`. Keep the Good Samaritan Drug Overdose Act reminder and RAAM clinic hours (Tuesdays, 12–3 pm at 1011 Elgin St. W.). Repeat “In an emergency call 911” anywhere urgent supports are listed.
- Footer copy on every page: “© {year} IHARC — Integrated Homelessness and Addictions Response Centre” plus “Inclusive, accessible, community-first data platform.”
- Site-wide `<title>` and meta description must remain:
  - `IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County`
  - `IHARC coordinates housing stability and overdose response with neighbours, agencies and local government in Northumberland County. Co-design plans, track data, get help.`
- Whenever STEVI is referenced, clarify that it is the secure workspace for clients, IHARC outreach staff, volunteers, and community partners. All login/account flows should link there instead of rendering local auth forms.
- When mentioning overdose response or emergency declarations, remind readers to call 911 immediately and note Good Samaritan protections.

## Product Snapshot
- Marketing routes live under `/(marketing)` and include the home page, About, Programs, Get Help, News, Data, Myth Busting, PIT detail pages, and the Supabase-backed Resources library. `src/app/stats` remains a dedicated metrics dashboard that reads from Supabase in real time.
- The site no longer renders `/portal/*`, `/login`, `/register`, `/reset-password`, `/petition`, `/command-center`, or `/solutions/*`. `middleware.ts` redirects any legacy path or auth flow to the STEVI host (default `https://stevi.iharc.ca`) while preserving query strings.
- Supabase-backed surfaces:
  - `/stats` and `/data` use `src/data/metrics.ts` plus `src/data/pit.ts` to display live indicators and point-in-time summaries.
  - `/resources` and `/resources/[slug]` use `src/lib/resources.ts` to list, filter, and render entries stored in `portal.resource_pages`.
  - Myth busting content uses cached loaders under `src/data/myths.ts`.
- Navigation/components now link to STEVI for sign-in/sign-up and highlight that portal plans, petitions, idea submissions, and admin tooling live there.
- Reusable layout pieces live in `src/components/layout` and `src/components/site`. Metrics visualisations moved to `src/components/metrics`.

## Operating Rules for Codex
- Always inspect the live schema through the Supabase MCP tool (or Supabase CLI). Do **not** rely on migration files to determine what exists in the database.
- Avoid running git commands unless they are absolutely necessary to complete a requested task.
- Keep edits in ASCII unless a file already uses other characters; favour `apply_patch` for concise modifications.
- Never introduce service-role keys into the Next.js runtime. All reads must use the public anon key via the server-side Supabase client.

## Current Tech & Architecture
- Framework: Next.js 15 App Router with React Server Components. Marketing routes primarily render static/streamed content while `/stats` remains `dynamic = 'force-dynamic'` to ensure fresh Supabase reads.
- Styling: Tailwind CSS with shared tokens in `src/styles/main.css`. Components expect the design tokens defined in `tailwind.config.ts`.
- Data access:
  - `src/lib/supabase/rsc.ts` creates the read-only server client using the anon key.
  - `src/data/metrics.ts`, `src/data/pit.ts`, and `src/data/myths.ts` wrap Supabase reads with `unstable_cache` plus tags from `src/lib/cache/tags.ts`.
  - `src/lib/resources.ts` centralises resource queries, filtering, and embed sanitisation.
- Middleware: `middleware.ts` maps legacy `/portal`, `/login`, `/register`, etc. paths to STEVI and issues a 307 redirect while preserving query strings.
- Components dedicated to the retired portal (idea cards, submission forms, petition UI, moderation queue, etc.) have been removed. Keep all new shared UI in `src/components` scoped by feature (e.g., `metrics`, `site`, `resources`).

### Data Loading & Caching
- Add new Supabase fetchers inside `src/data/` with explicit `CACHE_TAGS` entries and a revalidation window (default 120 s). Use `unstable_cache` to coalesce requests.
- `src/lib/cache/invalidate.ts` now exposes helpers for metrics, myth entries, and PIT summaries only. Use them inside future mutations or background jobs that change those tables.
- Never bypass the cached loaders with ad-hoc Supabase queries inside components. Consistency comes from the cache layers + invalidation helpers.

## Development Workflow
1. Node.js 20.x (npm 10+). Install dependencies with `npm install`.
2. Run `npm run dev` (port 3000). Supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` so Supabase reads succeed locally.
3. Type checking: `npm run typecheck`. Linting: `npm run lint`. Build verification: `npm run build`.
4. Vitest/playwright tooling remains in `package.json`, but the marketing app currently relies on manual verification. Add focused tests when building new data fetchers or components.

## Data, Safety & Moderation
- Marketing copy still must follow accessibility best practices (landmarks, heading order, focus-visible styles, labelled inputs, SR-only descriptions for metric context).
- Crisis/support content must keep the verified numbers above, reinforce Good Samaritan protections, and direct urgent matters to 911.
- Only fetch, store, and display public-safe data on this site. Any mutations, attachments, and sensitive workflows belong inside STEVI or Supabase Edge Functions.

## Deployment Notes
- Azure Static Web Apps deploys the `.next` artifact from `npm run build` (`next build`).
- Configure Supabase public secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Azure SWA; no service-role keys should be exposed to the marketing runtimes.
- Edge Functions are managed outside this repo; any ingestion or STEVI support functions are deployed separately.

### Donations
- The Donate + Manage Donation flows call Supabase donation Edge Functions via same-origin API routes under `src/app/api/donations/*` to avoid browser CORS preflights against `*.supabase.co/functions/v1/*`.
- The public donation catalogue (`/donate`) reads from the Supabase view `portal.donation_catalog_public`, which only includes rows from `donations.catalog_items` where `is_active = true`.
- Donation catalogue changes are cached briefly in Next.js (see `src/data/donation-catalog.ts` + `src/app/(marketing)/donate/page.tsx`), so new items may take up to ~1 minute to appear after being added.
- Stripe webhooks should target `https://iharc.ca/api/donations/stripe-webhook` (this forwards the raw webhook payload + `stripe-signature` header to the Supabase `donations_stripe_webhook` function using the anon key, so the Supabase function can keep JWT verification enabled).
- If your Supabase public key is the newer non-JWT `sb_publishable_*` format, any donation Edge Function you invoke must be deployed with `verify_jwt = false` (otherwise Supabase will return 401 before your function runs).
- If you intentionally want to call Supabase Edge Functions directly from the browser, ensure the relevant donation functions are configured to allow unauthenticated preflights (typically `verify_jwt = false`) and that `IHARC_SITE_URL` is set so `_shared/http.ts` can emit correct CORS headers.

## Documentation
- `README.md` – overview of the marketing site, guardrails, and developer workflow.
- `docs/portal/architecture.md` – updated architecture reference describing how the public site reads Supabase data and hands off portal work to STEVI.
- `docs/portal/mvp-plan.md` – marketing roadmap and iteration focus for public data surfaces.
- `INTEGRATIONS.md` – analytics and live chat configuration.


NOTES:
Always use context7 when you need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without being asked.

Always use the Supabase MCP tool to view existing implementation. Follow existing patterns already implemented, especially schema names outside of `public` such as `portal`, `core`, `inventory`, `justice`, etc. Inspect the live schema first and do not rely on migration files.
