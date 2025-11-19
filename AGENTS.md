## Mission & Audience Context
- This repository now serves the IHARC marketing site only. It shares public data, directs people to supports, and funnels all secure collaboration into STEVI (Supportive Technology to Enable Vulnerable Individuals).
- Keep copy strengths-based and community-first. Highlight how IHARC convenes neighbours, agencies, and local government without recreating portal workflows on this site.
- Use the full name **Integrated Homelessness and Addictions Response Centre (IHARC)** in formal copy and metadata. Always describe STEVI as the secure portal for clients, IHARC outreach staff, volunteers, and partners.

### Marketing Content Guardrails
- **Get Help**: list only the verified numbers — 2-1-1, Transition House coordinated entry **905-376-9562**, 9-8-8, and NHH Community Mental Health Services **905-377-9891**. The text line is offline; direct people to `outreach@iharc.ca`. Repeat “In an emergency call 911” anywhere crisis supports appear and include the Good Samaritan + RAAM clinic reminders.
- Footer copy: “© {year} IHARC — Integrated Homelessness and Addictions Response Centre” and “Inclusive, accessible, community-first data platform.”
- Site-wide title/description stay locked to `IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County` and the coordinated response description.
- Any sign-in/register link must point to STEVI (`steviPortalUrl`). No local auth, petitions, idea submissions, or admin tools live here anymore.

## Product Snapshot
- All live routes are under `/(marketing)` plus `/stats`. Pages include Home, About, Programs, Get Help, News, Myth Busting, Context, PIT breakdowns, and the Supabase-backed Resources listings.
- `/stats` renders the Community Status Dashboard using `src/data/metrics.ts` and chart components in `src/components/metrics`.
- `/data` uses PIT summaries + Supabase metrics to show trend cards and explanatory copy.
- `/resources` and `/resources/[slug]` pull from `portal.resource_pages` via `src/lib/resources.ts` and sanitise embeds.
- Legacy `/portal/*`, `/login`, `/register`, `/reset-password`, `/petition`, `/command-center`, and `/solutions/*` paths now redirect to the STEVI origin inside `middleware.ts`. Nothing in this repo handles authentication or submissions.

## Architecture Notes
- Framework: Next.js 15 App Router. Marketing pages rely on React Server Components; `/stats` forces dynamic rendering for real-time Supabase reads.
- Data access: `src/lib/supabase/rsc.ts` builds the anon client, and cached loaders live in `src/data/*.ts`. Only metrics, PIT, myth, and resource loaders remain.
- Tag-based caching: see `src/lib/cache/tags.ts` and `src/lib/cache/invalidate.ts`. New data modules must add tags + invalidation helpers if they mutate anything.
- Components for the legacy portal were removed. Shared marketing UI now sits under `src/components/layout`, `src/components/site`, `src/components/resources`, and `src/components/metrics`.
- Middleware intercepts `/portal`, `/auth`, `/login`, `/register`, `/reset-password`, `/api/portal`, `/ideas`, `/plans`, `/progress`, `/command-center`, and `/solutions/*` and issues 307 redirects to `steviPortalUrl`.

## Development Workflow
1. Install deps with `npm install` (Node ≥ 18.18).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase reads.
3. `npm run dev` to develop, `npm run lint`, `npm run typecheck`, `npm run build` to validate.
4. Keep analytics + consent logic intact (`ThemeProvider`, `AnalyticsProvider`, `ConsentBanner`).

## Data & Safety
- Only expose data meant for the public. Any sensitive plan/idea/petition workflow should happen in STEVI or Supabase Edge Functions.
- Maintain accessible semantics and consistent emergency messaging.
- When editing Supabase-backed content (metrics, PIT, resources), invalidate caches through the helpers in `src/lib/cache/invalidate.ts`.

## Deployment & Docs
- Azure Static Web Apps deploys from `npm run build` (see `build.js`).
- Supabase public env vars must exist in Azure; do not commit service-role keys.
- Edge Functions such as `portal-ingest-metrics` remain in `supabase/functions` to keep stats fresh for this site and STEVI. Redeploy via the Supabase CLI if they change.
- Reference docs:
  - `README.md` – overview + workflow
  - `docs/portal/architecture.md` – marketing-site architecture + data flow
  - `docs/portal/mvp-plan.md` – roadmap/backlog for public surfaces
  - `INTEGRATIONS.md` – analytics/chat configuration
