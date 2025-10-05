# IHARC Command Center

A Next.js 15 portal that powers the public “Solutions Command Center” for the Integrated Homelessness & Addictions Response Centre (IHARC). Community members, service agencies, and municipal partners can review live metrics, propose ideas, collaborate on threads, and coordinate moderation workflows.

## Requirements
- Node.js 18.18.0 or newer
- npm 9+
- Supabase project with the `portal.*` schema and edge functions deployed (see `docs/portal/architecture.md`)

## Environment Variables
Create a `.env.local` (for local development) and configure the corresponding secrets in Azure Static Web Apps **and** the GitHub repository secrets:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORTAL_INGEST_SECRET=...
PORTAL_ALERTS_SECRET=...
PORTAL_RESEND_API_KEY=...
PORTAL_EMAIL_FROM=...
```

`SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`, and `PORTAL_ALERTS_SECRET` are required only on the server/edge function side. Never expose them to the client. `PORTAL_RESEND_API_KEY` and `PORTAL_EMAIL_FROM` configure outbound notification delivery.

GitHub Actions expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` repository secrets so CI builds can initialize Supabase clients without a checked-in `.env` file.

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
- `/command-center` – Unified hub with live metrics and the community project board (legacy `/solutions` redirects here).
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

## Seeding the MVP (Supabase CLI)
Use the Supabase CLI (or the MCP Supabase tool inside Codex) to insert a complete demo idea, official response, and live metrics. This keeps environments aligned without manual UI data entry.

```bash
# Authenticate and link once
supabase login
supabase link --project-ref <your-project-ref>

# Apply the demo seed bundle
supabase db remote exec <<'SQL'
insert into portal.organizations (id, name, verified) values
  ('11111111-1111-4111-8111-111111111111', 'Northumberland Housing Taskforce', true)
on conflict (id) do nothing;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_anonymous, is_sso_user, created_at, updated_at) values
  ('00000000-aaaa-bbbb-cccc-111111111111', 'authenticated', 'authenticated', 'demo-submit@iharc.example', '', timezone('utc', now()), jsonb_build_object('provider','seed'), jsonb_build_object('display_name','Jordan Demo'), false, false, timezone('utc', now()), timezone('utc', now())),
  ('00000000-bbbb-cccc-dddd-222222222222', 'authenticated', 'authenticated', 'demo-org@iharc.example', '', timezone('utc', now()), jsonb_build_object('provider','seed'), jsonb_build_object('display_name','Housing Taskforce Lead'), false, false, timezone('utc', now()), timezone('utc', now()))
on conflict (id) do nothing;

insert into portal.profiles (id, user_id, display_name, organization_id, role, rules_acknowledged_at, display_name_confirmed_at) values
  ('22222222-2222-4222-8222-222222222222', '00000000-aaaa-bbbb-cccc-111111111111', 'Jordan Demo', null, 'user', timezone('utc', now()), timezone('utc', now())),
  ('33333333-3333-4333-8333-333333333333', '00000000-bbbb-cccc-dddd-222222222222', 'Housing Taskforce Lead', '11111111-1111-4111-8111-111111111111', 'org_rep', timezone('utc', now()), timezone('utc', now()))
on conflict (id) do nothing;

insert into portal.ideas (
  id, author_profile_id, title, body, problem_statement, evidence, proposal_summary,
  implementation_steps, risks, success_metrics, category, tags, status, is_anonymous, attachments
) values (
  '44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',
  'Expand Winter Overnight Outreach',
'Problem:\nEncampment residents lose contact with outreach teams during extreme cold.\n\nEvidence:\nCounty drug-poisoning response logs show a 40% drop in overnight check-ins when temperatures fall below -10°C.\n\nProposal:\nPilot a coordinated overnight outreach schedule with peer navigators and a warming bus on standby.\n\nSteps:\n1. Map encampment clusters.\n2. Assign paired outreach teams including peers.\n3. Stage warming bus at rotating locations.\n\nRisks:\nRequires additional EMS standby and volunteer rotation planning.\n\nSuccess metrics:\n• Overnight welfare checks completed (Baseline: 6 per night • Target: 12 per night)\n• Unused warming bus capacity (Goal: under 10%)',
  'Encampment residents lose contact with outreach teams during extreme cold snaps when crews suspend nightly rounds.',
'County drug-poisoning response logs show a 40% drop in overnight check-ins below -10°C. Hospital discharge planners report repeat presentations from the same encampments.',
  'Pilot a coordinated overnight outreach schedule with peer navigators and a warming bus on standby.',
  'Map encampment clusters, assign paired outreach teams including peers, and stage the warming bus at rotating locations aligned to shift hand-offs.',
  'Requires additional EMS standby and volunteer rotation planning.',
  '• Overnight welfare checks completed (Baseline: 6 per night • Target: 12 per night)\n• Unused warming bus capacity (Goal: under 10%)',
  'Health',
  array['winter','outreach'],
  'under_review',
  false,
  '[]'
)
on conflict (id) do nothing;

insert into portal.idea_metrics (id, idea_id, metric_label, success_definition, baseline, target) values
  ('55555555-5555-4555-8555-555555555555', '44444444-4444-4444-8444-444444444444', 'Overnight welfare checks', 'Number of documented check-ins with encampment residents during overnight outreach shifts.', '6 per night', '12 per night'),
  ('55555555-5555-4555-8555-555555555556', '44444444-4444-4444-8444-444444444444', 'Warming bus utilisation', 'Percentage of warming bus capacity used between 11pm and 5am.', '70%', '90%')
on conflict (id) do nothing;

insert into portal.comments (id, idea_id, author_profile_id, body, is_official, comment_type, evidence_url) values (
  '66666666-6666-4666-8666-666666666666',
  '44444444-4444-4444-8444-444444444444',
  '33333333-3333-4333-8333-333333333333',
  'County outreach is prepared to stage the warming bus on rotating routes starting next Monday. EMS leadership confirmed overnight coverage for the pilot period.',
  true,
  'response',
  'https://example.org/warming-bus-brief.pdf'
)
on conflict (id) do nothing;

insert into portal.idea_decisions (id, idea_id, author_profile_id, summary, visibility) values
  ('77777777-7777-4777-8777-777777777777',
   '44444444-4444-4444-8444-444444444444',
   '33333333-3333-4333-8333-333333333333',
   'Pilot scheduled for 14 nights. Team will report nightly metrics to the command center.',
   'public')
on conflict (id) do nothing;

insert into portal.metric_daily (metric_key, metric_date, value) values
  ('outdoor_count', timezone('utc', now())::date, 48),
  ('overdoses_reported', timezone('utc', now())::date, 3),
  ('warming_beds_available', timezone('utc', now())::date, 12)
on conflict (metric_key, metric_date) do update set value = excluded.value;
SQL
```

Sign in with the seeded community account (`demo-submit@iharc.example`) or the verified organization lead to walk through the full intake workflow, comment types, official responses, status transitions, and moderation timeline entries.

## Testing & QA
- `npm run lint` and `npm run typecheck` must pass before merging.
- Add unit tests alongside non-trivial utilities (rate limiting, safety checks, etc.).
- Vitest uses the `jsdom` test environment; install it locally with `npm install --save-dev jsdom` before running `npm run test`.
- Use `npm run e2e` for playwright smoke tests (requires `npm run build` beforehand).
- When adding Supabase migrations or policies, verify with `supabase db diff` and document changes in `docs/portal/`.

## Additional References
- `docs/portal/architecture.md` – deep-dive into schema, RLS policies, and edge function contracts
- `docs/portal/mvp-plan.md` – community project board implementation checklist and backlog
- `AGENTS.md` – contributor guidance, conventions, and current TODOs

## Key User Flows
- `/stats` – Community Status Dashboard with real-time homelessness and drug-poisoning response indicators.
- `/command-center` – Combined metrics + community project board hub replacing the old `/solutions` listing.
- `/register` / `/login` – Supabase-backed auth with automatic portal profile plus JWT claim sync.
- `/command-center/admin` – Staff workspace to ingest metrics and register partner organizations.
- `/solutions/*` – Idea submission, detail pages, and moderation tooling (index redirects to `/command-center`).

## Accessibility Notes
- Pages stay within IHARC's strengths-based language guidelines; headings and CTAs reinforce dignity-first storytelling.
- Metric dashboards provide screen reader summaries describing current values and trend directions.
- Forms include descriptive labels, inline guidance, and accessible validation feedback for screen reader users.
