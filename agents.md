# AGENTS.md

## Mission & Audience Context
- This repository delivers the public-facing IHARC Command Center and Community Solutions Portal.
- Audience includes community members, outreach teams, municipal partners, and agency leaders collaborating on opioid and homelessness response.
- Copy should remain strengths-based, inclusive, and stigma-free. Prioritise plain language and reinforce safety (no PII, respectful dialogue).

## Current Architecture Snapshot (2024 MVP)
- **Framework:** Next.js 14 App Router (React Server Components + Server Actions)
- **Styling:** Tailwind CSS + shadcn/ui primitives; theme-aware (light/dark) and WCAG AA compliant.
- **Data Layer:** Supabase JS v2 clients (`src/lib/supabase/*`) targeting the isolated `portal.*` schema with RLS.
- **Storage:** Private `portal-attachments` bucket. Attachments uploaded via server-validated signed URLs and rendered with short-lived signed downloads.
- **Edge Functions:** `portal-ingest-metrics`, `portal-moderate` deploy via Supabase CLI. Mutations fall back to Next.js route handlers where appropriate.
- **Hosting:** Azure Static Web Apps. `npm run build` executes `build.js` (lint + build) producing a standalone `.next/` bundle that Azure deploys alongside API routes.

## Key Directories & Files
- `src/app/` – App Router tree
  - `command-center/` – dashboard + admin ingestion interfaces
  - `solutions/` – idea backlog, submission flow, moderation queue, profile setup
  - `api/portal/*` – REST endpoints for ideas, votes, comments, flags, metrics, acknowledgement
- `src/components/portal/` – shared UI widgets for the portal (cards, comment threads, uploader, etc.)
- `src/lib/` – reusable logic: Supabase clients, audit logging, rate limiting, safety scanners, hashing utilities
- `docs/portal/architecture.md` – schema & RLS contract
- `docs/portal/mvp-plan.md` – current MVP scope + follow-up backlog
- `supabase/functions/*` – edge functions (Deno) deployed via `supabase functions deploy`

## Environment & Tooling
- Node ≥ 18.18.0, npm 9+
- Environment variables (local `.env.local`, Azure SWA secrets):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PORTAL_INGEST_SECRET`
- Install dependencies once (`npm install`). Use `npm run dev` (port 3000) for local work.
- Scripts:
  - `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e`, `npm run build`, `npm run start`
- Lint and typecheck must pass before merging. Prefer adding unit tests when touching utilities.

## Supabase Integration Guidelines
- Keep all new data in the `portal` schema; never modify shared public tables.
- RLS: rely on policies already defined in migrations. Use authenticated clients for user-scoped mutations; use the service client only in server actions/route handlers that require elevated access (metrics ingest, attachment uploads, admin operations).
- All mutations must call `logAuditEvent` with hashed IP + user agent metadata.
- Rate limiting: `checkRateLimit` enforces per-profile windows (ideas, comments, flags). Always gate new mutating endpoints with it.
- Safety: `scanContentForSafety` (client + server) rejects obvious PII and profanity; keep the allow/block lists in sync if you extend them.

## Accessibility & UX Expectations
- Maintain keyboard focus states (`focus-visible` utilities). Provide screen-reader summaries for charts and complex widgets.
- Respect default timezone `America/Toronto` when presenting dates.
- Anonymous posting masks display names but never removes author linkage for moderation/RLS.
- Moderation and official responses must remain clearly labelled (see `OrgBadge`, `StatusBadge`).

## Deployment Workflow (Azure SWA)
1. Ensure Supabase migrations and edge functions are deployed.
2. Configure Azure SWA secrets for Supabase environment variables.
3. GitHub Actions runs `npm run build` → `build.js` (lint + Next build). Output is deployed automatically.
4. Validate the deployed site by signing in, confirming `/command-center`, `/solutions`, and `/command-center/admin` render as expected.

## Current Implementation Status
- ✅ Next.js portal scaffold, shadcn/ui theme, and Supabase integration are in place.
- ✅ Core flows for idea submission, voting, commenting, flagging, moderation actions, and metric ingestion are wired with RLS-safe APIs.
- ✅ Attachments persist to `portal-attachments` with signed URLs; audit log records every mutation.
- 🚧 Dashboard trends intentionally display placeholders until data history accrues.

### Immediate Next Steps (post-MVP)
1. Expand automated test coverage (API route integration tests + storage signing).
2. Enrich metrics dashboard once daily history grows (aggregate charts, narrative insights).
3. Add notifications (email/webhook) for status changes and official responses.
4. Hook up advanced moderation signals (PII/profanity tables in DB, ML-based screening).

Keep this document updated when conventions or workflows change.
