# CLAUDE.md

Guidance for Claude Code (claude.ai/code) collaborating on the IHARC Command Center repository.

## Project Snapshot
- **Purpose:** Collaborative Solutions Command Center for IHARC partners, community members, and moderators.
- **Framework:** Next.js 15 App Router (React Server Components + selective client islands).
- **Data Stack:** Supabase Postgres (`portal` schema), Supabase Auth, Storage (`portal-attachments` bucket), edge functions for privileged operations.
- **Styling:** Tailwind CSS with shadcn/ui primitives and shared tokens in `tailwind.config.ts`.
- **Tooling:** TypeScript (strict), ESLint, Prettier, Vitest, Playwright, Supabase CLI.

## Repository Landmarks
- `src/app/` – App Router routes, layouts, and API handlers under `/api/portal/*`.
- `src/components/` – UI primitives (forms, boards, modals, badges) used across the portal.
- `src/lib/` – Utilities for auth/session handling, validation, formatting, and domain logic.
- `supabase/` – Edge functions (`portal-*`) plus generated types/migrations (additive only; `portal` schema shared across apps).
- `docs/portal/` – Architecture guidance, MVP milestones, operations notes.

## Local Workflow
1. Ensure Node.js ≥ 18.18.0 and npm 9+.
2. Copy `.env.example` → `.env.local` and populate Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`).
3. Install deps with `npm install`.
4. Run `npm run dev` (Next.js at http://localhost:3000).
5. Build via `npm run build`; preview with `npm run start`. Azure SWA uses the same `build.js`.

## Code Standards
- Maintain strict TypeScript; prefer shared types (`src/lib/types.ts`, Supabase generated types) instead of `any`.
- Use semantic HTML and accessible patterns (labels, aria attrs, focus management). Confirm AA contrast.
- Keep copy trauma-informed and community-positive.
- Leverage Tailwind utilities; extend theme centrally. Follow existing shadcn component variants.
- Prefer server components for data fetching and mutations via route handlers; isolate client-side logic to islands when necessary.
- Respect Supabase RLS by scoping queries to the authenticated profile and using service-role keys only in trusted contexts (edge functions or server actions).

## Testing & Quality
- `npm run lint` – ESLint with Next.js + Tailwind rules.
- `npm run typecheck` – `tsc --noEmit`.
- `npm run test` – Vitest suites (utilities, guards, hooks).
- `npm run e2e` – Playwright (requires `npm run build` first) for critical user journeys.
- Update or add tests alongside significant logic/UI changes.

## Supabase Notes
- `portal` schema tables power ideas, comments, flags, audit logs, metrics; other apps rely on them, so use additive migrations only.
- Authentication relies on Supabase JWTs. Client-side sessions should read role/claims from `user.app_metadata` and `user_metadata`; server handlers should verify via `supabaseServerClient.auth.getUser()` and Postgres policies should reference `auth.jwt()` claims.
- Edge functions (`portal-ingest-metrics`, `portal-moderate`, etc.) expect secrets and role checks; keep them in sync with database policies.

## Deployment
- Azure Static Web Apps pipeline runs `npm install` + `npm run build` using `build.js` resiliency.
- Supabase functions deploy with `supabase functions deploy <slug>`; document any required env updates.
- Coordinate releases to avoid breaking external consumers of shared Supabase resources.

## Collaboration Reminders
- Keep changes scoped; ensure `git status` clean before handoff.
- Document executed tests and Supabase migrations in summaries.
- Flag any unexpected data mutations immediately to maintain trust and safety safeguards.
