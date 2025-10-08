# IHARC Portal Architecture Overview

## Guiding Principles
- Extend the existing Supabase project strictly within the `portal` schema. Preserve auth configuration and enforce least-privilege with RLS, policies, and role-aware logic.
- Keep every portal route strengths-based, accessibility-aware, and ready to serve dynamic data. All `/portal/*` pages remain fully dynamic (`export const dynamic = 'force-dynamic'`).
- Maintain compassionate storytelling and privacy: anonymise neighbours by default, surface opt-in controls, and ensure audit logging for sensitive actions.
- Normalise time handling around `America/Toronto` for analytics, plan timelines, and petition milestones.

## Application Layers

### 1. Next.js 15 App Router Frontend
- Routes are split between marketing content (`/(marketing)`) and the authenticated collaboration surface (`/portal/*`). Legacy `/command-center` and `/solutions/*` paths redirect into the portal while preserving search parameters.
- `/portal/ideas` provides the proposal queue with filters, search, locked-action tooltips for guests, and a six-step submit wizard at `/portal/ideas/submit`. `/portal/ideas/[id]` shows summaries, metrics, typed comments, timelines, and “How to help” prompts, plus moderator-only promotion workflows.
- `/portal/plans` enumerates Working Plans; `/portal/plans/[slug]` offers tabs (Overview | Updates | Decisions | Timeline), a six-field plan update composer, decision notes, per-person support votes, and moderator actions (reopen, accept, not moving forward, added to plan).
- `/portal/progress` aggregates 30-day metrics and links back into stats and plans. `/portal/about` anchors commitments, privacy, and anonymisation guidelines.
- `/portal/petition/[slug]` and marketing `/petition` share the petition component, capturing signatures, display preferences, statements, and partner contact consent. Petition call-to-actions route supporters back into portal collaboration.
- Shared components (idea/plan cards, update composer, moderation queue, petition forms) live under `src/components/portal/`. Supabase data fetching uses server actions, RSC loaders, and client hooks with consistent caching strategies.

### 2. Supabase Schema (`portal` Namespace)
- **Profiles & Organisations**: `profiles`, `organizations`, `profile_contacts`, and enums (`profile_role`, `affiliation_type`, etc.) connect portal roles to `auth.users`.
- **Ideas**: `ideas`, `idea_metrics`, `idea_decisions`, `comments`, `votes`, `flags`, `attachments`. Denormalised counts and search vectors keep listings responsive.
- **Working Plans**: `plans`, `plan_focus_areas`, `plan_key_dates`, `plan_updates`, `plan_decision_notes`, `plan_update_votes`, plus `plan_updates_v` for efficient tab views.
- **Petitions**: `petitions`, `petition_signatures`, views `petition_public_summary`, `petition_public_signers`, and `petition_signature_totals` for public display and analytics.
- **Metrics & Notifications**: `metric_daily`, `notifications`, `audit_log`, along with helper functions (`current_profile_id`, `current_role`, `normalize_phone`).

### 3. Database Views, Enums & Functions
- Enums include `idea_category`, `idea_status`, `idea_publication_status`, `comment_type`, `flag_reason`, `flag_status`, `plan_update_status`, `petition_display_preference`, `reaction_type`, and metric keys.
- Views (`idea_reaction_totals`, `plan_update_reaction_totals`, `petition_public_summary`, `petition_signature_totals`) power dashboard summaries without bypassing RLS.
- Core functions: `portal_log_audit_event`, `portal_queue_notification`, `portal_check_rate_limit` (via RPC wrappers), `portal.ensure_profile`, `portal.petition_signature_totals_public`, and `portal.normalize_phone`.

### 4. Access Control & Safety
- Every table defaults to `REVOKE ALL`; RLS policies whitelist reads/writes by role. Public reads are limited to safe views. Moderators/admins gain elevated policies for promotion, status changes, decisions, and moderation queue actions.
- Mutations run through RPC helpers to guarantee audit logging and rate limiting. `portal_check_rate_limit` returns `retry_in_ms` for UI messaging.
- Official responses, plan updates, and petition statements all generate audit events (`plan_promoted`, `update_opened`, `update_accepted`, `update_declined`, `decision_posted`, `key_date_set`) to support accountability reporting.

### 5. Edge Functions & Server Actions
- `portal-moderate`: Handles idea status changes, official response tagging, moderation queue actions, and plan lifecycle events under moderator/admin authentication.
- `portal-ingest-metrics`: Authenticated via `PORTAL_INGEST_SECRET`, upserts `metric_daily` records, and logs ingestion events.
- `portal-attachments`: Issues signed URLs after verifying role-based access.
- `portal-admin-invite`: Processes administrative invites, ensuring Supabase Auth + audit instrumentation stays server-side.
- Server actions within Next.js wrap Supabase clients, enforce RLS-aware queries, and centralise rate checks.

### 6. Storage & Attachments
- Private bucket `portal-attachments` stores files (`idea/{idea_uuid}/{attachment_uuid}.{ext}`). Upload flow issues signed URLs only after MIME/type validation and size checks (≤ 8 MB). Metadata persists in `portal.attachments`.
- Petition collateral leverages the same storage patterns when campaigns include downloadable resources.

### 7. Authentication & Middleware
- Supabase Auth handles registration (`/register`), login, and session management. Middleware gates moderator-only routes and ensures portal profiles exist (`portal.ensure_profile`) upon first login.
- Profiles track petition opt-ins (`has_signed_petition`, `petition_signed_at`) and affiliations. Role claims steer UI states and RLS decisions.

### 8. Telemetry & Audit Logging
- Every mutation triggers `portal_log_audit_event`, capturing actor (profile/user), action, entity, and hashed IP/User-Agent metadata.
- Reaction totals, plan updates, and petition signatures roll up into materialised views for `/portal/progress` and marketing pages.
- Notifications queue emails/SMS via `portal_queue_notification`, with SMTP credentials managed in Azure Functions.
