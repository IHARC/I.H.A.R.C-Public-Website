# AGENTS.md

## Mission & Audience Context
- This repository powers the IHARC Solutions Command Center, an internal/external collaboration portal for homelessness and addictions response partners in Northumberland County, Ontario.
- Stakeholders include community members, municipal partners, outreach teams, and IHARC moderators who coordinate service improvements.
- Maintain empathetic, strengths-based, community-focused language across UI copy, notifications, and documentation.

## Tech & Architecture Overview
- **Framework:** Next.js 15 App Router with React Server Components, TypeScript, and edge runtime support.
- **Styling:** Tailwind CSS with shadcn/ui primitives and custom tokens defined in `tailwind.config.ts` and global styles under `src/app/globals.css`.
- **Data & Auth:** Supabase (Postgres + Auth + Storage) using the `portal` schema, RLS, and edge functions for privileged workflows.
- **Testing & Quality:** ESLint, Prettier, TypeScript `tsc --noEmit`, Vitest for unit tests, Playwright for end-to-end specs.
- **Hosting:** Azure Static Web Apps (Node build) deploying Next.js output via `build.js` orchestration.

### Key Directories & Files
- `src/app/` – App Router pages, layouts, route handlers, and API endpoints under `/api/portal/*`.
- `src/components/` – Shared UI building blocks (cards, status badges, comment widgets, modals, forms).
- `src/lib/` – Domain utilities (auth helpers, formatting functions, Supabase client wrappers, validation guards).
- `supabase/` – Edge function source (`portal-*`) plus any generated type definitions/migrations.
- `docs/portal/` – Architecture notes, MVP plan, and operational guidelines for the Command Center.
- `tests/` – Playwright specs; unit tests colocated near implementation files.

## Local Development Workflow
1. Install Node.js ≥ 18.18.0 (Next.js 15 requirement) and npm.
2. Install dependencies: `npm install`.
3. Create `.env.local` with Supabase keys (see `README.md`).
4. Run `npm run dev` to start the Next.js dev server at http://localhost:3000.
5. Production build: `npm run build`; serve locally with `npm run start`. `build.js` aligns local builds with Azure SWA expectations.

## Code Style & Implementation Guidelines
- Use semantic HTML and accessible patterns; follow the existing heading hierarchy for page sections.
- Prefer Tailwind utilities; extend design tokens centrally rather than adding ad-hoc CSS. Keep button and badge variants consistent.
- Typescript is strict—leverage shared interfaces (e.g., `src/lib/types.ts`, Supabase generated types) instead of `any`.
- Favor server components for data fetching when possible; isolate client interactivity in responsive islands.
- Enforce security & privacy: respect RLS policies, sanitize inputs, guard against over-fetching, and surface rate-limit messaging clearly.
- Ensure UI copy reflects trauma-informed, non-stigmatizing language.

## Content & Data Editing
- Portal navigation, quick actions, and role strings live in `src/lib/constants.ts` and related config files.
- Idea submission copy and form schema live in `src/app/solutions/submit` components; update validations in tandem with API handlers.
- Static assets reside in `public/`; reference with root-relative paths (`/logo.svg`).
- Docs for deployment/architecture are under `docs/portal`; keep them updated when workflows change.

## Integrations & Environment Variables
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`, plus optional analytics/chat keys. Never commit secrets.
- Supabase auth uses JWT claims; ensure role checks run via `auth.jwt()` claims, Postgres policies, or `getSession()` helpers.
- Edge functions (`portal-ingest-metrics`, `portal-moderate`, etc.) rely on secrets defined in Supabase project settings; sync updates after changes.

## Testing Expectations
- Run `npm run lint`, `npm run typecheck`, and `npm run test` for unit coverage before submitting changes that touch logic.
- Execute `npm run e2e` (after `npm run build`) when altering flows that impact routing, auth, or cross-page behavior.
- Update/add tests alongside new features—especially around moderation, rate limiting, and multi-step forms.

## Deployment Notes
- Azure SWA pipeline runs `npm install` + `npm run build`; confirm environment variables are configured in Azure.
- Supabase edge functions must be deployed with the Supabase CLI (`supabase functions deploy portal-…`). Keep versions in sync with repo code.
- Coordinate database migrations carefully: `portal` schema is shared with other apps. Avoid breaking changes; use additive migrations only.

## Workflow Expectations for Future Changes
- Keep PRs focused and ensure `git status` is clean before completion.
- Document relevant test runs and Supabase updates in summaries.
- Uphold accessibility, performance, and data security standards across all contributions.
