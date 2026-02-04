## Mission & Audience Context
- This repository now serves the IHARC marketing site only. It shares public data, directs people to supports, and funnels all secure collaboration into STEVI (Supportive Technology to Enable Vulnerable Individuals).
- Keep copy strengths-based and community-first. Highlight how IHARC convenes neighbours, agencies, and local government without recreating portal workflows on this site.
- Use the full name **Integrated Homelessness and Addictions Response Centre (IHARC)** in formal copy and metadata. Always describe STEVI as the secure portal for clients, IHARC outreach staff, volunteers, and partners.
- Site-wide title/description stay locked to `IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County` and the coordinated response description.
- Any sign-in/register link must point to STEVI (`steviPortalUrl`). Do not reintroduce local authentication, petitions, idea submissions, or other portal workflows here.
- Transparency/policies are Supabase-backed. Marketing is read-only on `portal.policies` (anon only sees `status='published'`). All CRUD happens in STEVI.

### Marketing Content Guardrails
- **Get Help**: list only the verified numbers — 2-1-1, Transition House coordinated entry **905-376-9562**, 9-8-8, and NHH Community Mental Health Services **905-377-9891**. The text line is offline; direct people to `outreach@iharc.ca`. Repeat “In an emergency call 911” anywhere crisis supports appear and include the Good Samaritan + RAAM clinic reminders.
- Footer copy: “© {year} IHARC — Integrated Homelessness and Addictions Response Centre” and “Inclusive, accessible, community-first data platform.”

## Product Snapshot
- All live routes are under `/(marketing)` plus `/stats`. Pages include Home, About, Programs, Get Help, News, Myth Busting, Context, PIT breakdowns, Supabase-backed Resources, Transparency (`/transparency`), and Policies (`/policies`, `/policies/[slug]`).
- `/stats` renders the Community Status Dashboard using `src/data/metrics.ts` and chart components in `src/components/metrics`.
- `/data` uses PIT summaries + Supabase metrics to show trend cards and explanatory copy.
- `/resources` and `/resources/[slug]` pull from `portal.resource_pages` via `src/lib/resources.ts` and sanitise embeds.
- `/policies` and `/policies/[slug]` pull from `portal.policies` via `src/data/policies.ts` (tagged `marketing:policies`) and render sanitized HTML.
- Legacy `/portal/*`, `/login`, `/register`, `/reset-password`, `/petition`, `/command-center`, and `/solutions/*` paths now redirect to the STEVI origin inside `middleware.ts`. This repo does not implement local auth or portal submissions—public donation/volunteer flows are handled via the API proxies below.

## Architecture Notes
- Framework: Next.js 15 App Router. Marketing pages rely on React Server Components; `/stats` forces dynamic rendering for real-time Supabase reads.
- Data access: `src/lib/supabase/rsc.ts` builds the anon client for dynamic reads; cacheable reads can reuse `src/lib/supabase/public-client.ts`. Cached loaders live in `src/data/*.ts`.
- Tag-based caching: see `src/lib/cache/tags.ts` and `src/lib/cache/invalidate.ts`. Active tags include `metrics`, `mythEntries`, `pitSummary`, per-PIT `pitCount`, `siteFooter`, and `marketing:policies`.
- Components for the legacy portal were removed. Shared marketing UI now sits under `src/components/layout`, `src/components/site`, `src/components/resources`, and `src/components/metrics`.
- Middleware intercepts `/portal`, `/auth`, `/login`, `/register`, `/reset-password`, `/api/portal`, `/ideas`, `/plans`, `/progress`, `/command-center`, and `/solutions/*` and issues 307 redirects to `steviPortalUrl`.

## Public API routes (keep minimal)
These are thin proxies to Supabase Edge Functions. Keep them small and avoid moving business logic into the marketing site.

- `/api/volunteer/submit` → `volunteer_submit_application`
- `/api/donations/create-checkout-session` → `donations_create_checkout_session`
- `/api/donations/create-subscription-session` → `donations_create_subscription_session`
- `/api/donations/request-manage-link` → `donations_request_manage_link`
- `/api/donations/stripe-webhook` → `donations_stripe_webhook` (passes `stripe-signature` through; do not “parse then re-stringify” the body)

## GitHub workflow
- Track work in GitHub Issues; keep the issue body as the spec (acceptance criteria + validation steps).
- Ship changes via a pull request from a branch (no direct commits to `main`).
- Prefer GitHub CLI (`gh`) for PR ops: `gh pr create`, `gh pr view`, `gh pr checks --watch`, `gh pr merge`.
- Codex Cloud automatically reviews PRs; treat it as a required gate alongside checks (often ~5 minutes each) and address feedback before merging.
- Optional: if Codex review is enforced as a required check/review, enable auto-merge to avoid manual waiting (`gh pr merge --auto --squash`).
- Cross-repo features (public surface + admin): create one issue here and a linked issue in STEVI; merge order should be explicit (typically STEVI schema/admin first).
- Validate before merge: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## Development Workflow
1. Install deps with `npm install` (Node 20.x, see `.nvmrc` + `package.json` engines).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase reads.
3. `npm run dev` to develop, `npm run lint`, `npm run typecheck`, `npm run build` to validate.
4. Keep analytics + consent logic intact (`ThemeProvider`, `AnalyticsProvider`, `ConsentBanner`).

## Data & Safety
- Only expose data meant for the public. Any sensitive plan/idea/petition workflow should happen in STEVI or Supabase Edge Functions.
- Maintain accessible semantics and consistent emergency messaging.
- When editing Supabase-backed content (metrics, PIT, resources, policies), invalidate caches through the helpers in `src/lib/cache/invalidate.ts`.

## Deployment & Docs
- Azure Static Web Apps deploys from `npm run build`.
- Supabase public env vars must exist in Azure; do not commit service-role keys.
- This repo does not contain Supabase Edge Function source; it invokes Edge Functions via API routes. Any ingestion or background jobs live in STEVI or external automation.
- Reference docs:
  - `README.md` – overview + workflow
  - `docs/portal/architecture.md` – marketing-site architecture + data flow
  - `docs/portal/mvp-plan.md` – roadmap/backlog for public surfaces
  - `INTEGRATIONS.md` – analytics/chat configuration
