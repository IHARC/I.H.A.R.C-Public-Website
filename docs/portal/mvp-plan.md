# Portal Delivery Notes

This document tracks the current state of the public-facing IHARC Portal MVP and the near-term priorities that keep the workspace evolving in step with community needs.

## Delivered Capabilities
- **Idea collaboration**: `/portal/ideas` queue with filters, guest tooltips, and six-step submission (`/portal/ideas/submit`). Canonical idea pages include metrics, typed comments, timeline history, and the moderator-only “Promote to Working Plan” workflow.
- **Working Plans**: `/portal/plans` directory and `/portal/plans/[slug]` tabs (Overview | Updates | Decisions | Timeline) with update composer, plan support voting, decision notes, and moderator actions (`reopen`, `accept`, `not moving forward`, `added to plan`).
- **Progress dashboard**: `/portal/progress` summarises 30-day metrics with navigation back to stats, ideas, and plans. Audit events power update streaks and decision logs.
- **Petition campaigns**: `/portal/petition/[slug]` (and marketing `/petition`) capture signatures, statements, partner consent, and display preferences, all backed by `petition_public_summary` views.
- **Safety & governance**: RLS-enforced Supabase schema, audit logging for every mutation, moderation queue handled via `portal-moderate`, private attachments bucket, and cooldown messaging backed by `portal_check_rate_limit`.

## Current Iteration Focus
- Harden the idea → plan promotion flow by verifying sponsor/support thresholds, seeding focus areas, and logging `plan_promoted` plus `key_date_set` events.
- Ensure plan updates include all six required fields, respect `plan_update_status` transitions, and emit `update_opened`, `update_accepted`, `update_declined`, and `added_to_plan` audit events.
- Persist filters and search parameters when moving between `/portal/ideas`, `/portal/plans`, and `/portal/progress`, including legacy redirects.
- Fine-tune petition storytelling so marketing and portal surfaces stay aligned, highlight anonymisation guidance, and reinforce partner follow-up consent.

## Near-Term Opportunities
- Expand `/portal/progress` with additional plan outcome metrics and petition signature rollups once enough history exists.
- Introduce notification templates that reference petition involvement and plan support votes while respecting opt-out preferences.
- Explore light-touch analytics overlays (e.g., spark lines) that stay accessible and respect real-time data constraints.
- Continue deprecating references to legacy `/command-center` UI in favour of `/portal/*` components, ensuring search params remain intact.

## Collaboration Checklist
- Coordinate schema changes through Supabase migrations and immediately update `docs/portal/architecture.md`.
- Use the Supabase MCP tool (or CLI) to verify policies, enums, and views before shipping features that depend on them.
- Confirm Edge Functions (`portal-moderate`, `portal-ingest-metrics`, `portal-attachments`, `portal-admin-invite`) are redeployed after schema or environment updates.
- Validate language and accessibility requirements with community partners before publishing new petition content or plan narratives.
