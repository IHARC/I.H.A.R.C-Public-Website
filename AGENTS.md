# I.H.A.R.C-Public-Website Codex Agent Guide
Last updated: 2026-03-08
Status: Working guide (living document)
Standard: IHARC AGENTS v1

## Maintenance (living document / persistent memory)
This file is durable context for new Codex sessions.

- Keep this file concise and high-signal. Link to docs for deep architecture detail.
- Remove stale guidance when behavior changes.
- Update `Last updated` for substantive changes.
- Never add secrets, donor personal data, or internal-only URLs.

## Operating mode (Codex)
- Follow workspace defaults in `/home/jordan/github/AGENTS.md`.
- Use a read-only `explorer` sub-agent for non-trivial codebase context gathering first, and only spawn it when you intend to wait for and use its output.
- Do not repeat that same delegated context search in the main session while it is still unresolved or after a brief poll; use `rg` only for narrowly scoped follow-up verification of specific details.
- Keep this repo marketing-only. Secure collaboration/auth flows belong in STEVI.

## Mission and guardrails
- Use the full name: Integrated Homelessness and Addictions Response Centre (IHARC).
- Describe STEVI as the secure portal for clients, IHARC outreach staff, volunteers, and partners.
- Any sign-in/register path must point to STEVI (`steviPortalUrl`).
- Do not reintroduce local auth, petitions, idea submissions, or portal workflows.
- Transparency/policies are read-only here; CRUD belongs in STEVI.

## Critical public copy constraints
- Keep verified support contacts current and exact on help surfaces:
  - 2-1-1
  - Transition House coordinated entry: `905-376-9562`
  - 9-8-8
  - NHH Community Mental Health Services: `905-377-9891`
  - Email fallback: `outreach@iharc.ca`
- Include `In an emergency call 911` anywhere crisis supports are shown.
- Preserve Good Samaritan and RAAM reminders where crisis supports are presented.

## Validation matrix (run what matches your change)
- Typical app changes: `npm run lint`, `npm run typecheck`, `npm run test`.
- Build-affecting changes: `npm run build`.
- Content/data loading changes: verify cache invalidation logic and affected routes.

## Public API and data boundaries
- Keep API routes as thin proxies to Supabase Edge Functions.
- Do not move business logic into this repo.
- Only expose data intended for public audiences.

## Directory routing and overrides
Use nearest `AGENTS.override.md` rules first for specialized work.

- `src/app/(marketing)/get-help/AGENTS.override.md`: crisis/help content safety and copy constraints.

## Canonical docs
- `README.md`
- `docs/portal/architecture.md`
- `docs/portal/mvp-plan.md`
- `INTEGRATIONS.md`
