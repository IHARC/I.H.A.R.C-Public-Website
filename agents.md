## Mission & Audience Context
- The portal is the public-facing MVP for the IHARC Command Center. It prioritizes compassionate, strengths-based storytelling for Northumberland residents navigating housing instability and substance use.
- Content should emphasize collaboration, dignity, and community care. Avoid deficit-based language and maintain trust with service users, neighbours, and agency partners.
- Two core intents drive every iteration: (1) surface real-time community statistics on homelessness and overdose response, and (2) provide a collaborative "command center" where neighbours, agencies, and government co-design rapid solutions in plain, accessible language. 

## Product Intent & Current State
- `/ideas` is the public proposal queue. Banner copy explains the 1-2-3 idea workflow. Guests see tooltips on locked actions; auth users get type-enforced comments, single-vote support, and the six-step idea form at `/ideas/submit` (Problem → Evidence → Proposed change → Steps → Risks → Metrics). Submission still blocks without evidence and ≥1 metric." 
- `/ideas/[id]` shows the canonical summary, metrics, typed comments, timeline, and the right-rail “How to help” helper. Moderators/org reps can post official responses. The “Promote to Working Plan” card is moderator-only, enforcing support/sponsor criteria before creating plans.
- `/plans` lists Working Plans with next key date, focus area chips, and CTA into each plan. `/plans/[slug]` replaces RFC flows with tabs (Overview | Updates | Decisions | Timeline), a plan-update composer, community support buttons (one-person-one-vote), and moderator actions (reopen, accept, not moving forward, added to plan).
- `/progress` summarizes 30-day metrics alongside navigation back to stats and plans. `/about` documents plain-language commitments for the portal.
- `/command-center` and legacy `/solutions/*` now redirect into `/ideas` while preserving search params. Moderation queue, profile management, and stats remain accessible via existing routes.
- Notifications, audit logging, board role rules, and cooldown messaging remain unchanged. Audit event types extended to cover plan lifecycle actions (plan_promoted, update_opened, update_accepted, update_declined, decision_posted, key_date_set).

## Current Tech & Architecture
- **Framework:** Next.js 15 App Router with TypeScript.
- **Rendering:** All routes remain dynamic (`export const dynamic = 'force-dynamic'`) to fetch fresh Supabase data per request.
- **Styling:** Tailwind utilities with shared tokens in `src/styles/main.css` and design enforcement via Tailwind config.
- **Data:** Supabase schema `portal` now includes Working Plan tables (`plans`, `plan_focus_areas`, `plan_key_dates`, `plan_updates`, `plan_decision_notes`, `plan_update_votes`, `plan_updates_v`). Existing idea/comment/vote tables unchanged. Fallback keys are baked into Supabase helpers for local dev without secrets.
- **Build:** `npm run build` runs `build.js` (Next lint/build). Azure Static Web Apps deploys `.next`.
- **Testing:** Vitest (unit) and Playwright (e2e) available; Vitest requires `jsdom` dev dependency. Default workflow still manual.

## Key Directories & Files
- `src/app/ideas` – Proposal queue, submit wizard, and idea detail pages.
- `src/app/plans` – Working Plan list/detail pages (tabs, composer, moderator tools).
- `src/app/api/portal/plans` – API endpoints for plan promotion, updates, support votes, and status transitions.
- `src/components/portal/` – Idea/plan cards, plan update composer + moderation actions, promote dialog, kanban board, moderation queue, etc.
- `src/lib/` – Supabase clients, audit helpers, new `plans.ts` constants (support threshold, default focus areas, slug helper).
- `src/styles/main.css` – Design overrides and base typography.
- `.github/workflows/azure-static-web-apps-happy-beach-01eb36a10.yml` – CI/CD deploying `.next` to Azure Static Web Apps.

## Development Workflow
1. Node.js ≥ 18.18 required. Install deps with `npm install` (single npm lockfile).
2. Run `npm run dev` (default port 3000). Provide Supabase credentials for live data; fallback keys hit the placeholder project.
3. Type checking: `npm run typecheck`. Linting: `npm run lint`. Build verification: `npm run build`.
4. Vitest requires `jsdom` (`npm install --save-dev jsdom`) before `npm run test`. Playwright e2e tests require a build `npm run build` first.

- Keep TypeScript strict; prefer explicit types, avoid `any`, and reuse shared enums from generated Supabase types.
- Use Tailwind utilities for styling; extend `main.css` only for shared tokens or cross-app patterns.
- Maintain accessible semantics (landmarks, heading order, labelled inputs, focus-visible states, SR-only descriptions for metrics/timelines).
- Normalize App Router params (`searchParams`/`params`) and perform mutations in server actions or API route handlers with Supabase service clients.
- All mutations must log via `logAuditEvent` and respect RLS. Rate limiting should call `checkRateLimit` and surface `retry_in_ms` feedback in UI.
- Idea submit wizard: enforce evidence + ≥1 metric, display cooldown messaging, and keep comment composer type/evidence requirements.
- Working Plan lifecycle: promotion requires verified sponsor or ≥ support threshold with full idea sections. Creating a plan inserts focus areas + first key date, sets idea status to `in_progress`, and logs `plan_promoted` + `key_date_set` events.
- Plan updates must include all six fields and default to `open` state. Use audit events for `update_opened`, `update_accepted`, `update_declined`, `decision_posted`, and `update` summary refresh (`added_to_plan`).
- Persist URL params (filters, metric ranges, search) when linking across Ideas, Plans, and Stats. Legacy `/command-center` and `/solutions/*` should continue redirecting with params.
- Moderation queue actions still route through `portal-moderate`. Working Plan moderation uses API endpoints directly; ensure notes are captured.

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

