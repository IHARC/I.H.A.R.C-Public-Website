# IHARC Command Center

A Next.js 15 portal that powers the public “Solutions Command Center” for the Integrated Homelessness & Addictions Response Centre (IHARC). Community members, service agencies, and municipal partners can review live metrics, propose ideas, collaborate on threads, and coordinate moderation workflows.

## Requirements
- Node.js 18.18.0 or newer
- npm 9+
- Supabase project with the `portal.*` schema and edge functions deployed (see `docs/portal/architecture.md`)

## Environment Variables
Create a `.env.local` (for local development) and configure the corresponding secrets in Azure Static Web Apps:

```
NEXT_PUBLIC_SUPABASE_URL=https://vfavknkfiiclzgpjpntj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_DpKb92A7lPsPjK0Q3DHw0A_RtkRomXp
SUPABASE_SERVICE_ROLE_KEY=...
PORTAL_INGEST_SECRET=...
PORTAL_ALERTS_SECRET=...
PORTAL_RESEND_API_KEY=...
PORTAL_EMAIL_FROM=...
```

`SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`, and `PORTAL_ALERTS_SECRET` are required only on the server/edge function side. Never expose them to the client. `PORTAL_RESEND_API_KEY` and `PORTAL_EMAIL_FROM` configure outbound notification delivery.

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
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run build` | Production build (`build.js` orchestrates Azure-friendly build) |
| `npm run start` | Preview the production build locally |

`npm run build` executes `build.js`, which mirrors the Azure Static Web Apps pipeline (lint + build). The output is a standalone Next.js bundle under `.next/` suitable for the Azure SWA Node runtime.

## Portal Architecture (MVP)
- **Framework**: Next.js App Router + React Server Components
- **UI**: Tailwind CSS, shadcn/ui, and lightweight Recharts charts
- **State & Data**: Supabase JS v2 (RSC, route handlers, client components)
- **Storage**: Private `portal-attachments` bucket accessed via signed URLs
- **Authentication**: Supabase Auth (email/password or existing providers)
- **Safety Guards**: Shared profanity + PII scanners, rate limit checks, moderation flags, full audit logging

### Primary Routes
- `/` – Landing page highlighting the stats dashboard and community command center.
- `/stats` – Community Status Dashboard with live metrics and accessible summaries.
- `/command-center` – Unified hub with live metrics and the community sprint board (legacy `/solutions` redirects here).
- `/command-center/admin` – Moderator/admin portal for metrics ingestion and partner registry.
- `/solutions` – Legacy entry point that now redirects to `/command-center` to keep older links working.
- `/solutions/submit` – Authenticated idea submission with attachments.
- `/solutions/[id]` – Idea detail, discussion thread, and official responses.
- `/solutions/profile` – Participant profile setup (display name, affiliation).
- `/solutions/mod` – Moderation queue for resolving flags (moderator/admin only).
- `/register`, `/login` – Supabase-backed authentication flows.

### API Endpoints
All implemented as Next.js Route Handlers under `/api/portal/*`:
- `POST /api/portal/ideas` – create idea + attachments
- `POST /api/portal/ideas/:id/vote` – toggle votes
- `POST /api/portal/ideas/:id/comments` – create threaded comments (2-level depth)
- `POST /api/portal/flags` – submit moderation flags
- `GET /api/portal/metrics` – public metrics feed for the dashboard
- `POST /api/portal/profile/ack` – record first-post community rules acknowledgement

Every mutation records a `portal.audit_log` entry with hashed IP + user-agent metadata.

## Azure Static Web Apps Deployment
1. Ensure required environment variables are defined in Azure SWA configuration (`NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`).
2. The GitHub workflow should run `npm install` and `npm run build`; `build.js` guarantees lint + build parity with Azure.
3. Deploy the generated `.next/` output (Azure automatically wires SSR/API routes into the Functions host).
4. Supabase Edge Functions (`portal-ingest-metrics`, `portal-moderate`) must be deployed separately via the Supabase CLI.

## Seeding the MVP (No SQL Required)
1. **Create a moderator account** via Supabase Auth (e.g., invite yourself) and elevate the `portal.profiles.role` to `moderator` or `admin` using the Supabase Dashboard.
2. **Register a partner organization**
   - Sign in to the portal, visit `/command-center/admin`, and use the “Register partner organization” form to add an agency. Toggle the verified checkbox if applicable.
3. **Seed an initial metric**
   - On the same admin page, submit one daily metric (e.g., `outdoor_count`) with today’s date so the dashboard cards render.
4. **Create portal profile**
   - Visit `/solutions/profile` to set your display name and link the organization you just created.
5. **Post the first idea**
   - Go to `/solutions/submit`, acknowledge the community rules, and share an idea. Attachments are optional but will be stored privately in `portal-attachments` with signed URLs.

These steps populate the minimum data set that Azure SWA will surface publicly once deployed.

## Testing & QA
- `npm run lint` and `npm run typecheck` must pass before merging.
- Add unit tests alongside non-trivial utilities (rate limiting, safety checks, etc.).
- Use `npm run e2e` for playwright smoke tests (requires `npm run build` beforehand).
- When adding Supabase migrations or policies, verify with `supabase db diff` and document changes in `docs/portal/`.

## Additional References
- `docs/portal/architecture.md` – deep-dive into schema, RLS policies, and edge function contracts
- `docs/portal/mvp-plan.md` – sprint-oriented implementation checklist and backlog
- `AGENTS.md` – contributor guidance, conventions, and current TODOs

## Key User Flows
- `/stats` – Community Status Dashboard with real-time homelessness and harm reduction indicators.
- `/command-center` – Combined metrics + sprint board hub replacing the old `/solutions` listing.
- `/register` / `/login` – Supabase-backed auth with automatic portal profile plus JWT claim sync.
- `/command-center/admin` – Staff workspace to ingest metrics and register partner organizations.
- `/solutions/*` – Idea submission, detail pages, and moderation tooling (index redirects to `/command-center`).

## Accessibility Notes
- Pages stay within IHARC's strengths-based language guidelines; headings and CTAs reinforce dignity-first storytelling.
- Metric dashboards provide screen reader summaries describing current values and trend directions.
- Forms include descriptive labels, inline guidance, and accessible validation feedback for screen reader users.
