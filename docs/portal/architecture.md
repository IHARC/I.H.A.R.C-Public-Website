# IHARC Public Website Architecture

The legacy portal experience now lives entirely inside STEVI. This document explains how the marketing site is structured so that public storytelling stays aligned with STEVI while still surfacing Supabase-backed data such as resources, metrics, and point-in-time (PIT) counts.

## Guiding Principles
- Keep `/` and `/(marketing)` routes strengths-based, accessible, and ready to tell the IHARC story without recreating secure workflows.
- Treat STEVI as the single source of truth for authentication, client work, idea submission, plan updates, and petitions. The marketing site should only link to STEVI for those flows.
- Continue to use Supabase (`portal` schema) for read-only datasets that power marketing pages (metrics, resources, PIT summaries, myth busters). Respect all RLS policies and never bypass cached loaders.
- Normalise all timestamps to `America/Toronto` when rendering Supabase data.

## Application Layers

### 1. Next.js 15 App Router Frontend
- Routes live under `/(marketing)` plus `/stats`. There are no `/portal/*`, `/login`, `/register`, or `/petition` pages in this repo anymore.
- `/stats` is the Community Status Dashboard. It keeps `export const dynamic = 'force-dynamic'` so each request fetches fresh Supabase metrics.
- `/data` combines PIT summaries with the latest metrics to tell the story of housing support and overdose response trends.
- `/resources` lists, filters, and renders Supabase-managed resources (reports, delegations, presentations, etc.). Embeds are sanitised before rendering.
- Navigation (`TopNav`, `SiteFooter`, `AuthLinks`) links to STEVI for any login/request-access CTA.
- `middleware.ts` intercepts legacy portal paths (e.g., `/portal`, `/ideas`, `/plans`, `/progress`, `/command-center`, `/solutions`, `/login`, `/register`, `/reset-password`, `/api/portal`) and redirects them to the STEVI origin with a 307 status.

### 2. Supabase Reads
- `src/lib/supabase/rsc.ts` uses `@supabase/ssr` with the anon key to build the server-side client. There is no browser client because the site is read-only.
- Data modules:
  - `src/data/metrics.ts` – queries `portal.metric_daily` and related `metric_catalog` rows, groups them, and powers both cards (`DashboardCards`) and charts (`TrendChart`).
  - `src/data/pit.ts` – reads PIT rollups (summary counts plus community breakdowns) exposed via Supabase views.
  - `src/data/myths.ts` – loads myth-busting content curated in Supabase tables.
  - `src/lib/resources.ts` – fetches `portal.resource_pages`, normalises attachments, and sanitises embedded HTML before passing data to Next.js routes.
- Each module wraps Supabase reads with `unstable_cache` and tags from `src/lib/cache/tags.ts`. The only active tags after the portal removal are `metrics`, `mythEntries`, `pitSummary`, and per-PIT `pitCount`.

### 3. Components
- Marketing UI lives in `src/components/site`, `src/components/layout`, and `src/components/resources`.
- Metrics-specific charts/cards now live under `src/components/metrics`.
- Providers (`ThemeProvider`, `AnalyticsProvider`, `ConsentBanner`) sit in `src/app/layout.tsx` so every page honours analytics consent and theming.

### 4. Access Control & Safety
- No authentication is performed inside this app. All requests run with Supabase anon credentials; RLS restricts reads to public-safe views.
- Middleware keeps Supabase session cookies aligned with the anon client by calling `updateSession`, but no user identities are exposed.
- Any mutations or sensitive storage (attachments, notifications, petitions, plan updates, etc.) are handled by STEVI or Supabase Edge Functions. Do not add server actions or `/api/*` routes that bypass that boundary.

### 5. Edge Functions & Background Jobs
- Functions under `supabase/functions` remain available for ingestion and STEVI support. The marketing site primarily depends on `portal-ingest-metrics` to keep `metric_daily` fresh and `portal-attachments` for resource collateral managed in Supabase.
- If you modify any function, redeploy it using the Supabase CLI so the shared Supabase project stays in sync.

### 6. Point-in-Time Counts
- PIT counts are stored in the shared Supabase project. `src/data/pit.ts` reads public-friendly summaries (ensuring small cells are suppressed) and powers the `/data` page.
- If you add new PIT displays, respect the existing suppression rules and reuse the cache helpers in `src/lib/cache/invalidate.ts`.

### 7. Middleware Redirects
- `middleware.ts` maps the following legacy paths to STEVI: `/portal`, `/auth`, `/login`, `/register`, `/reset-password`, `/ideas`, `/plans`, `/progress`, `/command-center`, `/solutions`, and `/api/portal`. It preserves query strings and returns a 307 redirect.
- After this redirect check, `updateSession` ensures Supabase cookies are refreshed so anonymous Supabase reads continue to work on marketing pages.

### 8. Future Enhancements
- Add new Supabase-backed stories under `src/data/` and surface them inside `/(marketing)` pages. Make sure to create accompanying cache tags + invalidation helpers.
- If STEVI introduces new public dashboards, expose them here by building RSC loaders and read-only components—never copy the authenticated experience.
- Keep documentation current when marketing copy or data sources change so other agents understand that this repository is marketing-only.
