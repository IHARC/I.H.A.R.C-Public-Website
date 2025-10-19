# IHARC Portal & Main Site

The Integrated Homelessness and Addictions Response Centre (IHARC) is a non-profit delivering outreach and wraparound supports with neighbours across Northumberland County. This project powers both the public iharc.ca marketing site and the IHARC Portal—the collaboration and crisis management workspace where community partners co-design housing and overdose responses. The portal pairs real-time metrics, working plans, and petitions so neighbours, peer workers, agencies, and municipal partners stay aligned through a dignified, strengths-based workflow.

## Requirements
- Node.js 18.18.0 or newer
- npm 9+
- Supabase project with the `portal` schema (ideas, working plans, petitions) and edge functions deployed. See `docs/portal/architecture.md` for required functions and policies.

## Environment Variables
Create a `.env.local` for local development and configure the same values in Azure Static Web Apps and Supabase function environments.

### Next.js runtime
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are the only variables that ship to the client. They power the authenticated Supabase browser client and server actions.

### Supabase Edge Functions and secure automation
Store the following in environment settings managed by Supabase or Azure Functions. They must never be included in the client bundle or committed to source control.

```
SUPABASE_SERVICE_ROLE_KEY=...
PORTAL_INGEST_SECRET=...
PORTAL_ALERTS_SECRET=...
PORTAL_EMAIL_FROM=...
PORTAL_SMTP_HOST=...
PORTAL_SMTP_PORT=587
PORTAL_SMTP_USERNAME=...
PORTAL_SMTP_PASSWORD=...
PORTAL_SMTP_SECURE=true
```

`SUPABASE_SERVICE_ROLE_KEY` is required only for Supabase-managed Edge Functions (`portal-moderate`, `portal-ingest-metrics`, `portal-attachments`, `portal-admin-invite`). Local development should access privileged operations via the Supabase CLI or MCP tool, never by embedding service-role keys in the Next.js runtime.

GitHub Actions expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` repository secrets so CI builds can initialise Supabase clients without a checked-in `.env` file.

## Getting Started
```bash
npm install
npm run dev
```
Local development runs at `http://localhost:3000`.

### Useful Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run lint` | ESLint (required before deploying) |
| `npm run typecheck` | TypeScript project check |
| `npm run test` | Vitest unit tests (requires `jsdom` as a dev dependency) |
| `npm run e2e` | Playwright end-to-end smoke tests (after `npm run build`) |
| `npm run build` | Production build orchestrated by `build.js` (lint + build) |
| `npm run start` | Preview the production build locally |
| `npm run preview` | Start the production build on port 4321 for Playwright |

`npm run build` executes `build.js`, mirroring the Azure Static Web Apps pipeline. The output is a standalone Next.js bundle under `.next/` that Azure serves with SSR/API integration.

## Reports & Resources Hub
- Marketing resources live at `/resources` with detail pages at `/resources/[slug]`. Content is sourced from the typed catalog in [`src/data/resources.ts`](./src/data/resources.ts).
- Each resource entry supports the following fields: `slug`, `title`, `kind`, `datePublished`, optional `summary`, optional `location`, `tags`, an `embed` union (Google Doc, PDF, video, external link, or sanitized HTML), optional `attachments`, and optional `coverImage` for future social previews.
- Embeds are restricted to an allowlist defined in [`src/lib/resources.ts`](./src/lib/resources.ts). Approved hosts include `docs.google.com`, `drive.google.com`, `www.youtube.com`, `youtube.com`, `youtu.be`, `player.vimeo.com`, `vimeo.com`, and `iharc.ca`. Update the allowlist before introducing a new host.
- Raw HTML embeds are cleaned with [`sanitizeEmbedHtml`](./src/lib/sanitize-embed.ts), which strips scripts, enforces safe iframe attributes, and blocks non-allowlisted hosts.
- Add attachments by providing `{ label, url }` pairs in the `attachments` array. Attachments render as download buttons beneath the primary embed on the detail page.
- To add a new resource, update the catalog file, ensure the embed host is allowed, and optionally supply a `coverImage` URL for metadata. Query parameters on `/resources` (`q`, `kind`, `tag`, `year`) power search, type, tag, and year filtering automatically.

## Portal Overview
All `/portal/*` routes export `dynamic = 'force-dynamic'` to read fresh Supabase data on every request. Authenticated and guest states are handled via Supabase's RLS policies and RPC helpers.

### Primary Routes
- `/portal/ideas` – Public proposal queue with the 1-2-3 idea workflow, filters, and tooltips explaining locked actions for guests.
- `/portal/ideas/submit` – Six-step idea form (Problem → Evidence → Proposed change → Steps → Risks → Metrics) that enforces evidence and at least one metric before submission. Cooldown messaging explains rate limits.
- `/portal/ideas/[id]` – Canonical idea summary, metrics, typed comments, timeline entries, “How to help” rail, and moderator/org official responses. Moderators can promote eligible ideas to plans once support and sponsor criteria are met.
- `/portal/plans` – Working Plan directory with focus-area chips, next key date, and CTA into each plan.
- `/portal/plans/[slug]` – Plan detail with tabs (Overview | Updates | Decisions | Timeline), update composer, community support buttons (one-person-one-vote), and moderator actions (reopen, accept, not moving forward, added to plan).
- `/portal/progress` – 30-day metric summary with navigation back to stats and plans.
- `/portal/progress/pit` – Weekly point-in-time dashboard with anonymised aggregates for each outreach count.
- `/portal/about` – Plain-language commitments outlining safety, privacy, and strengths-based storytelling expectations.
- `/portal/petition/[slug]` – Petition campaigns with signature tracking, opt-in partner contact permissions, and post-sign sharing options.
- `/portal/profile` – Profile management, affiliation context, and petition signature history for authenticated neighbours.
- Legacy `/ideas`, `/plans`, `/progress`, `/command-center`, and `/solutions/*` routes redirect to their `/portal/*` counterparts while preserving query parameters. Marketing content remains under `/(marketing)`.

### Collaborative Workflow
1. Community members share proposals through the `/portal/ideas/submit` wizard.
2. Moderators validate content, apply evidence or type requirements, and surface official agency responses.
3. Ideas that meet support thresholds and sponsor requirements are promoted to Working Plans, logging `plan_promoted` and seeding focus areas plus first key date.
4. Plan owners publish six-field updates that start in `draft` and move through `open`, `accepted`, `not_moving_forward`, or `added_to_plan`, each emitting audit events (`update_opened`, `update_accepted`, `update_declined`, `added_to_plan`).
5. Community members support plans with a single vote, and moderators post decision notes or adjust status via the plan tabs.
6. `/portal/progress` aggregates 30-day metrics so neighbours can see how ideas, plans, and petition energy influence frontline response.

### Petition Campaigns
The petition component powers both marketing (`/petition`) and portal (`/portal/petition/[slug]`) signatures. It verifies supporter defaults, honours display preferences (`anonymous`, `first_name_last_initial`, `full_name`), and logs uptake through `petition_public_summary` and `petition_signature_totals` views. Community partners can invite supporters to collaboration sessions when they opt in.

## Data & Services
- Supabase JS v2 handles data across React Server Components, route handlers, and client components. No service-role keys are bundled with the app.
- The `portal` schema includes ideas (`ideas`, `idea_metrics`, `idea_decisions`, `comments`, `votes`, `flags`), working plan tables (`plans`, `plan_focus_areas`, `plan_key_dates`, `plan_updates`, `plan_decision_notes`, `plan_update_votes`, `plan_updates_v`), and petition resources (`petitions`, `petition_signatures`, `petition_public_summary`, `petition_public_signers`, `petition_signature_totals`).
- All mutations execute through authenticated Supabase clients plus RPC helpers (`portal_log_audit_event`, `portal_queue_notification`, `portal_check_rate_limit`, etc.) and record audit events.
- Private attachments live in the `portal-attachments` storage bucket. Signed URL generation happens server-side after validation.
- Notifications, cooldowns, and moderation queue actions rely on existing edge functions and RLS-aware API routes.

## Azure Static Web Apps Deployment
1. Ensure required environment variables are defined in Azure Static Web Apps (`NEXT_PUBLIC_*` for the app, Supabase + SMTP secrets for Functions).
2. The GitHub workflow runs `npm install` and `npm run build`; `build.js` guarantees lint + build parity with Azure.
3. Deploy the generated `.next/` output. Azure maps Next.js SSR and API routes automatically.
4. Deploy Supabase Edge Functions (`portal-moderate`, `portal-ingest-metrics`, `portal-attachments`, `portal-admin-invite`) via the Supabase CLI after schema changes.

## Working with Supabase
- Use the Supabase MCP tool (or the Supabase CLI) to inspect tables, views, policies, and functions. Do **not** rely on migration files as the source of truth for the current schema.
- Keep Supabase migrations in `supabase/migrations/` aligned with schema changes and update `docs/portal/` when new tables, enums, or policies are introduced.
- Rotate secrets through Supabase and Azure portals; never commit keys to the repository.

## Testing & QA
- `npm run lint` and `npm run typecheck` must pass before merging.
- Add unit tests alongside non-trivial utilities (rate limiting, safety checks, Supabase RPC wrappers).
- Install `jsdom` locally (`npm install --save-dev jsdom`) before running `npm run test`.
- Use `npm run e2e` for Playwright smoke tests after building the app.
- When adding Supabase migrations or policies, run `supabase db diff` to validate changes and document impacts in `docs/portal/`.

## Additional References
- `docs/portal/architecture.md` – Deep dive into schema, RLS policies, edge functions, and portal flows.
- `docs/portal/mvp-plan.md` – Product delivery notes, current iteration focus, and future backlog.
- `AGENTS.md` – Contributor guidance, tone, and operational constraints.

## Accessibility & Language
- Pages follow IHARC’s strengths-based language guidelines; headings and CTAs reinforce dignity-first storytelling.
- Metric dashboards include screen reader summaries describing current values and trend directions.
- Forms provide descriptive labels, inline guidance, and accessible validation feedback. Petition consent messaging reiterates anonymisation commitments.
- Moderator tooling preserves audit trails and reminds stewards about privacy before publishing official responses.
