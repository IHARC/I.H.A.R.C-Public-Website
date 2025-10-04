# AGENTS.md

## Mission & Audience Context
- The portal is the public-facing MVP for the IHARC Command Center. It prioritizes compassionate, strengths-based storytelling for Northumberland residents navigating housing instability and substance use.
- Content should emphasize collaboration, dignity, and community care. Avoid deficit-based language and maintain trust with service users, neighbours, and agency partners.
- Two core intents drive every iteration: (1) surface real-time community statistics on homelessness and harm reduction, and (2) provide a collaborative "command center" where neighbours, agencies, and government co-design rapid solutions in plain, accessible language.

## Product Intent & Current State
- `/command-center` remains the unified hub with metric tiles, accessible summaries, filters, and the sprint board. Spotlight cards surface recent activity.
- `/solutions/submit` now delivers a structured six-step wizard (Problem → Evidence → Proposed Change → Steps → Risks → Metrics). Submission blocks without evidence and at least one metric definition.
- Idea detail pages expose a locked canonical summary, a dedicated metrics panel, evidence-linked comments, and a timeline aggregating status changes, assignments, official responses, and revision requests.
- Comments are typed: community members must choose Question or Suggestion (with optional evidence URL). Verified org, moderator, and admin roles can post pinned official responses via the composer toggle.
- Moderation queue groups flags into New, Needs context, and Actioned tabs. Moderator actions, including "needs context" notes, create public timeline entries and enforce note entry.
- Status transitions on the board are role-aware: moderators/admins can drag anywhere; verified org reps can move ideas within limited lanes (new → under_review → in_progress/adopted/not_feasible).
- Notifications (assignment, status change, revision) are queued server-side with audit logging. Cooldowns and rate limits return retry hints and surface countdown UI in the wizard/composer.
- Legacy `/solutions` links still redirect to `/command-center` while preserving query params. `/stats` continues to host the Community Status Dashboard with screen-reader summaries and date-range respect.

## Current Tech & Architecture
- **Framework:** Next.js 15 App Router with TypeScript.
- **Rendering:** All routes are forced dynamic (`export const dynamic = 'force-dynamic'`) to ensure fresh Supabase data on every request.
- **Styling:** Tailwind CSS utilities with shared styles in `src/styles/main.css` and design tokens enforced via Tailwind config.
- **Data:** Supabase (schema `portal`) powers metrics, ideas, comments, decisions, and organizations. Fallback keys are baked into the Supabase helpers so builds succeed without environment variables.
- **Build:** `npm run build` executes `build.js`, which lint/builds via Next.js. Output directory for Azure Static Web Apps is `.next`.
- **Testing:** Vitest (unit) and Playwright (e2e) are available but not wired into the default build workflow yet.

## Key Directories & Files
- `src/app/` – App Router routes: unified command center (`command-center`), stats dashboard (`stats`), legacy solutions routes (index redirects to the hub), profile + moderation tools, and API routes under `portal/`.
- `src/components/portal/` – React components for dashboard cards, idea cards, charts, filters, moderation queue, etc.
- `src/lib/` – Supabase clients (`supabase/`), audit helpers, accessibility utilities.
- `src/styles/main.css` – Design system overrides and base typography.
- `.github/workflows/azure-static-web-apps-happy-beach-01eb36a10.yml` – CI/CD deploying `.next` to Azure Static Web Apps.

## Development Workflow
1. Node.js ≥ 18.18 required. Install deps with `npm install` (single npm lockfile).
2. Run `npm run dev` for the local server (default port 3000). Provide Supabase credentials for live data; fallback keys target a placeholder project.
3. Type checking: `npm run typecheck`. Build verification: `npm run build`.
4. Unit tests use Vitest with the `jsdom` environment—install `jsdom` locally (`npm install --save-dev jsdom`) before `npm run test`. Playwright e2e tests require `npm run build` beforehand.

## Implementation Guidelines
- Keep TypeScript strict: prefer explicit types and avoid `any`.
- Use Tailwind utilities for layout/styling; extend `main.css` only for shared tokens.
- Maintain accessible semantics: headings, labelled inputs, focus-visible states, high contrast, and SR-only summaries.
- Normalize App Router params (`searchParams`/`params`) and gate writes through server actions/route handlers with Supabase service clients.
- All mutations must log via `logAuditEvent` and respect RLS policies; rate limiting should call `checkRateLimit` and honor `retry_in_ms` feedback in the client.
- Submission wizard must enforce evidence + ≥1 metric and display cooldown messaging. Comment composer must require type selection, optionally capture evidence URLs, and lock official toggles behind verified roles.
- Persist URL params (filters, metric ranges, search) when linking between command center sections, stats, and legacy `/solutions/*` routes.
- Moderation queue actions require notes, always fan out to `portal-moderate` Edge Function, and emit timeline entries.

## Content & Tone
- Narratives should highlight community solutions, peer insights, and agency collaboration. Center first-person perspectives respectfully.
- Avoid publishing identifying information for neighbours; reinforce anonymization guidelines in UI copy and API validations.

## Deployment Notes
- Azure deploy uses the `.next` artifact; ensure `npm run build` passes before pushing to `main`.
- Configure Supabase secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, service role, alerts secret) in Azure SWA.
- Use the Supabase CLI or Codex Supabase tool for migrations and seeds; avoid committing raw seed SQL files (see README for the current seeding block).
- Confirm Edge Functions (`portal-moderate`, `portal-ingest-metrics`) are deployed after schema changes.

## Documentation
- `README.md` for setup specifics and design goals.
- `INTEGRATIONS.md` for analytics/chat toggles (currently optional).
- Supabase schema definitions live in `supabase/` – update there when changing database tables.

Use this file as the single source of truth for repo conventions; remove outdated assumptions when architecture changes.
