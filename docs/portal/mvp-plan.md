# Public Website Delivery Notes

This document replaces the legacy portal MVP plan. It now tracks the state of the IHARC marketing site and the priorities that keep public storytelling connected to the STEVI workspace.

## Delivered Capabilities
- **Marketing shell**: All primary content (Home, About, Programs, Get Help, News, Myth Busting, Context) lives under `/(marketing)` with shared layout, analytics consent, and STEVI CTAs.
- **Real-time metrics**: `/stats` renders cards and charts from `portal.metric_daily`. `/data` summarises those metrics alongside PIT rollups.
- **Resource library**: `/resources` and `/resources/[slug]` pull from `portal.resource_pages` with sanitised embeds, tags, and attachments.
- **STEVI handoff**: `middleware.ts` and layout components route `/portal/*`, `/login`, `/register`, `/petition`, `/command-center`, `/solutions`, and other legacy paths to the STEVI origin while keeping query parameters intact.
- **Accessibility guardrails**: Emergency numbers, Good Samaritan reminders, and consistent footers are enforced across the marketing pages.

## Current Iteration Focus
- Keep Supabase reads healthy by monitoring the `portal` schema views the marketing site depends on (`metric_daily`, PIT summaries, `resource_pages`, myth busting tables). Update `src/data/*` loaders and cache tags when schemas evolve.
- Ensure every marketing CTA that suggests signing in or submitting information links directly to STEVI (`steviPortalUrl`). Avoid reintroducing local auth or submission flows.
- Refresh copy blocks when IHARC partners provide new hotline numbers, RAAM info, or STEVI messaging. Coordinate with outreach staff before making changes to Get Help or emergency copy.
- Audit remaining dependencies periodically and remove libraries that were only needed for the deprecated portal UI.

## Near-Term Opportunities
- Extend `/data` with additional Supabase-driven trend explanations or partner spotlights (e.g., overdose prevention, community collaborations) while keeping the experience read-only.
- Explore lightweight historical comparisons on `/stats` (e.g., previous week vs. current week) without storing extra data locally.
- Add filters or search across `/resources` if the library continues to grow.
- Document any new STEVI workflows on `iharc.ca` via static content (e.g., “How STEVI works”) instead of embedding login forms.

## Collaboration Checklist
- Continue to verify schema changes through the Supabase MCP tool before coding against tables or views.
- When adding new data loaders, create accompanying cache tags in `src/lib/cache/tags.ts` and invalidation helpers in `src/lib/cache/invalidate.ts`.
- Keep `README.md` and `agents.md` aligned so future contributors know this repo is marketing-only.
- Any ingestion or background jobs should live outside this repo (STEVI or external automation).
