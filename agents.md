## Mission & Audience Context
- The portal is the public-facing IHARC Portal MVP, centring compassionate, strengths-based storytelling for Northumberland residents navigating housing instability and substance use.
- Content must emphasise collaboration, dignity, and community care. Avoid deficit framing and maintain trust with service users, neighbours, and agency partners.
- Every iteration advances two intents: (1) surface real-time community statistics on homelessness and overdose response, and (2) provide a collaborative IHARC Portal where neighbours, agencies, and government co-design rapid solutions in plain, accessible language.
- Always refer to the organization as the **Integrated Homelessness and Addictions Response Centre (IHARC)**. Use “and” (not “&”) in formal copy, metadata, and footers.

### Marketing Content Guardrails
- **Get Help** must list verified numbers only: 2-1-1, Transition House coordinated entry **905-376-9562**, 9-8-8, and NHH Community Mental Health Services **905-377-9891**. Note that the IHARC text line is under maintenance—direct people to `outreach@iharc.ca` instead. Keep the Good Samaritan Drug Overdose Act reminder and RAAM clinic hours (Tuesdays, 12–3 pm at 1011 Elgin St. W.).
- Repeat the emergency call-to-action “In an emergency call 911” wherever urgent supports are listed.
- Footer copy on every page: “© {year} IHARC — Integrated Homelessness and Addictions Response Centre” plus the descriptive line “Inclusive, accessible, community-first data platform.”
- Site-wide `<title>` and meta description:  
  - `IHARC — Integrated Homelessness and Addictions Response Centre | Northumberland County`  
  - `IHARC coordinates housing stability and overdose response with neighbours, agencies and local government in Northumberland County. Co-design plans, track data, get help.`
- Emergency brief language must pluralise petition signatures correctly (“1 neighbour has signed” vs “0/2+ neighbours have signed”) and link to press coverage for context.
- When referencing overdose response, remind readers to call 911 immediately and note Good Samaritan protections.

## Product Snapshot
- `/portal/ideas` is the public proposal queue with 1-2-3 workflow guidance, guest tooltips for locked actions, authenticated comments with enforced types, and the six-step submit form at `/portal/ideas/submit` (Problem → Evidence → Proposed change → Steps → Risks → Metrics). Submissions require evidence and at least one metric.
- `/portal/ideas/[id]` presents the canonical summary, metrics, typed comments, timeline, and “How to help” rail. Moderators and verified org reps post official responses, while the Promote to Working Plan card enforces support and sponsor thresholds.
- `/portal/plans` lists Working Plans with focus-area chips, next key date, and CTA. `/portal/plans/[slug]` delivers tabbed detail (Overview | Updates | Decisions | Timeline), plan-update composer, community support buttons (one-person-one-vote), and moderator actions (reopen, accept, not moving forward, added to plan).
- `/portal/progress` summarises 30-day metrics alongside quick navigation back to stats and plans. `/portal/about` documents plain-language commitments and privacy safeguards.
- `/portal/petition/[slug]` hosts petition campaigns with signature tracking, display preferences, and post-sign actions. Marketing surfaces (`/petition`, `/portal/about` preview content) link back into portal experiences.
- Legacy `/ideas`, `/plans`, `/progress`, `/command-center`, and `/solutions/*` routes (plus `/command-center` admin tools) now redirect into `/portal/*` while preserving search params. Marketing content lives in `/(marketing)`.

## Operating Rules for Codex
- Always inspect the live schema through the Supabase MCP tool (or Supabase CLI). Do **not** rely on migration files to determine what exists in the database.
- Avoid running git commands unless they are absolutely necessary to complete a task the user has requested.
- Keep edits in ASCII unless a file already uses other characters; favour `apply_patch` for concise modifications.
- Never introduce service-role keys into the Next.js runtime. Privileged actions must run via Supabase Edge Functions or authenticated server clients.

## Current Tech & Architecture
- Framework: Next.js 15 App Router with React Server Components. All `/portal/*` routes export `dynamic = 'force-dynamic'` to fetch fresh Supabase data.
- Styling: Tailwind CSS with shared tokens in `src/styles/main.css`; design system enforced via Tailwind config.
- Data: Supabase schema `portal` covers ideas (`ideas`, `idea_metrics`, `idea_decisions`, `comments`, `votes`, `flags`), working plans (`plans`, `plan_focus_areas`, `plan_key_dates`, `plan_updates`, `plan_decision_notes`, `plan_update_votes`, `plan_updates_v`), petitions (`petitions`, `petition_signatures`, `petition_public_summary`, `petition_public_signers`, `petition_signature_totals`), and metrics (`metric_daily`). All reads and mutations depend on RLS, RPC helpers (`portal_log_audit_event`, `portal_queue_notification`, `portal_check_rate_limit`, etc.), and Edge Functions.
- Components: Idea cards, plan composer, moderation queue, kanban board, petition sign form, and helper rails live in `src/components/portal/`.
- Caching: All read funnels use tag-aware cached loaders in `src/data/*` backed by `unstable_cache`. Mutation routes and server actions must invalidate via `src/lib/cache/invalidate.ts` instead of calling `revalidatePath` directly. Do not add compatibility shims or fallbacks—new code must follow the tagged cache contract.
- Storage: Private `portal-attachments` bucket accessed through signed URLs after server-side validation.

### Future Routes & Data Fetching
- Create new cached data accessors under `src/data/` when adding Supabase reads. Each accessor must declare tags from `src/lib/cache/tags.ts` and an explicit revalidation window (default 120 seconds unless operational requirements demand otherwise).
- Any mutation (API route, server action, Edge Function) affecting cached tables must call the appropriate helper in `src/lib/cache/invalidate.ts`. Pass explicit paths only when a page needs path-level revalidation; never rely on implicit behaviour.
- Do not introduce legacy fallbacks (e.g., optional direct Supabase fetches alongside cached helpers) or conditional paths that bypass cache invalidation. All code must assume the tagged cache is authoritative.

## Development Workflow
1. Node.js ≥ 18.18 and npm 9+ are required. Install dependencies with `npm install`.
2. Run `npm run dev` (default port 3000). Supply Supabase credentials for live data; fallback keys point to placeholder projects.
3. Type checking: `npm run typecheck`. Linting: `npm run lint`. Build verification: `npm run build`.
4. Vitest requires `jsdom` (`npm install --save-dev jsdom`) before `npm run test`. Playwright e2e tests require a build via `npm run build`.

## Data, Safety & Moderation
- Maintain accessible semantics (landmarks, heading order, labelled inputs, focus-visible states, SR-only descriptions for metrics/timelines).
- Idea submission enforces evidence plus ≥1 metric; comment composer respects type and evidence requirements.
- Working Plan lifecycle logs audit events (`plan_promoted`, `update_opened`, `update_accepted`, `update_declined`, `decision_posted`, `key_date_set`). Plan updates must populate all six fields and default to `open`.
- Rate limiting uses `checkRateLimit`/`portal_check_rate_limit` RPCs with `retry_in_ms` surfaced in UI. All mutations log via `logAuditEvent`.
- Moderation queue actions continue to route through the `portal-moderate` Edge Function. Attachments are signed through `portal-attachments` after role checks. Notifications, board role rules, and cooldown messaging remain unchanged.

## Deployment Notes
- Azure Static Web Apps deploys the `.next` artifact generated by `npm run build` (via `build.js`, which runs lint + build).
- Configure Supabase public secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Azure SWA; keep service-role keys only in Supabase-managed environments and edge functions.
- Use the Supabase CLI or Codex Supabase tool for migrations and seeds; avoid committing raw seed SQL files.
- Confirm Edge Functions (`portal-moderate`, `portal-ingest-metrics`, `portal-attachments`, `portal-admin-invite`) are redeployed after schema changes.

## Documentation
- `README.md` – setup, environment, portal overview.
- `docs/portal/architecture.md` – schema, RLS, edge function contracts, portal flows.
- `docs/portal/mvp-plan.md` – current iteration focus and future backlog.
- `INTEGRATIONS.md` – analytics/live chat configuration toggles.

test fix

