# IHARC Command Center Architecture Overview

## Guiding Principles
- Preserve existing Supabase auth configuration; extend functionality strictly within a new `portal` schema.
- Isolate all storage to a private bucket `portal-attachments` using signed URL access.
- Enforce least-privilege through RLS, Postgres policies, and role-aware logic in API handlers and Edge Functions.
- Meet WCAG AA accessibility targets and provide resilient, offline-friendly UX where practical.
- Default timezone handling to `America/Toronto` across database timestamps, analytics, and UI presentation.

## High-Level Components
1. **Next.js 14 App Router Frontend**
   - Routes `/command-center`, `/command-center/admin`, `/solutions`, `/solutions/submit`, `/solutions/[id]`, `/solutions/profile`, `/solutions/mod`.
   - Uses TypeScript, Tailwind, shadcn/ui primitives, and Supabase JS v2 for data access.
   - Implements reusable component library (Cards, TrendChart, IdeaCard, StatusBadge, TagChips, UpvoteButton, CommentThread, AttachmentUploader, OrgBadge, RulesModal, EmptyState, Paginator, SearchBar, Filters).
   - Client/server validation for PII and profanity; rate-limit messaging surfaced via UI.
   - Accessibility features include keyboard navigation, aria labels, screen reader summaries, high contrast support.

2. **Supabase Schema (`portal` namespace)**
   - `portal.profiles`: Connects to `auth.users` via FK; stores display name, optional org, role enum `{user, org_rep, moderator, admin}`.
   - `portal.organizations`: Agency/org registry with verification flag.
   - `portal.ideas`: Core Idea entity with category enum, tags array, status enum, anonymous flag, counts, timestamps, last activity.
   - `portal.idea_edits`: Historical body snapshots with editor reference.
   - `portal.attachments`: Metadata for stored files (path, mime, size, checksum) linked to ideas.
   - `portal.comments`: Two-level threaded comments with official flag.
   - `portal.votes`: Composite PK `(idea_id, voter_id)` toggling support.
   - `portal.flags`: Moderation flags with status enum and metadata.
   - `portal.audit_log`: Append-only audit trail for all mutations.
   - `portal.metrics_daily`: Daily metric time-series for dashboard.
   - Support tables: `portal.pi_guard` (regex patterns), `portal.profanity_guard` (blocked terms) for managed lists.

3. **Database Types & Helpers**
   - Enums: `portal.role_type`, `portal.idea_category`, `portal.idea_status`, `portal.flag_reason`, `portal.flag_status`, `portal.metric_key`, `portal.entity_type` (for flags/audit).
   - Views/materialized views for metrics aggregation where warranted (e.g., 7-day, 30-day rollups).
   - Functions:
     - `portal.ensure_profile()` to create default profile for authenticated users.
     - `portal.log_audit(actor uuid, action text, entity portal.entity_type, entity_id uuid, meta jsonb)` to centralize audit writes.
     - `portal.assert_rate_limit(...)` to enforce per-user idea/comment quotas.
     - `portal.detect_pii(text)` and `portal.detect_profanity(text)` returning boolean and matched tokens for server-side validation.
     - `portal.update_counts()` trigger to keep denormalized idea counts in sync.

4. **RLS & Security**
   - Default deny on all `portal.*` tables with selective policies for read/write.
   - Public read policies on metrics, organizations, ideas (filtered to non-archived), comments with `is_official` gating for non-auth?
   - Authenticated insert/update policies referencing `auth.uid()` matching `portal.profiles.user_id`.
   - Moderation/Admin policies enabling status changes, flag resolution, official comments.
   - Flags & audit logs restricted to moderator/admin roles; Expose aggregated counts for others where needed via dedicated views.
   - Enforce vote uniqueness via PK and RLS check; allow toggling by deleting record.

5. **Edge Functions**
   - `portal-ingest-metrics`: Protected by header secret `PORTAL_INGEST_SECRET`; upserts `portal.metrics_daily` with audit log entry.
   - `portal-moderate`: Requires authenticated session with moderator/admin role; handles idea status transitions, official response tagging, flag resolution, content archiving; logs actions.

6. **Storage**
   - Bucket `portal-attachments` (private). Objects stored under `idea/{idea_uuid}/{attachment_uuid}.{ext}`.
   - An attachment upload API issues signed URLs post server-side validation (mime allowlist, size <= 8MB, file scanning hook stub).
   - Attachment metadata recorded in `portal.attachments` referencing idea and uploader.

7. **API Layer (Next.js Route Handlers/Server Actions)**
   - `POST /api/portal/ideas`: Validates input, rate limits, enforces PII/profanity guard, handles attachments via signed URLs, writes idea, edit history, audit.
   - `POST /api/portal/ideas/:id/vote`: Toggle semantics with audit.
   - `POST /api/portal/ideas/:id/comments`: Validates depth, role requirements for official comments, attachments? (comments use text only), logs audit.
   - `POST /api/portal/flags`: Records flag, auto-notifies moderators (placeholder), audit.
   - `GET /api/portal/metrics`: Returns 7/30 day data + latest snapshot; includes screen reader summary text.

8. **Client Authentication Flow**
   - Email/password login and registration via Supabase Auth; multi-step sign-up capturing display name, organization selection, community rules acknowledgment.
   - `middleware.ts` gatekeeping for `/solutions/mod` and `/command-center/admin` routes.
   - On first login, server ensures `portal.profiles` record with role `user` exists.

9. **Safety & Moderation**
   - Shared utility for PII detection (regex for emails, phone, addresses, doxxing phrases) used both client & server.
   - Profanity list maintained server-side; client fetches hashed set for local blocking.
   - Auto-flag when server detects PII/profanity after initial block.
   - Rate limit using DB function + caching (Redis optional placeholder) and fallback in API layer.

10. **Telemetry & Auditing**
    - All mutations call `portal.log_audit` with hashed IP (SHA-256 truncated) and user agent where available; API extracts metadata from headers.
    - Dashboard displays counts using aggregated views; admin metrics ingestion writes to audit with `action` value `portal.metrics.ingest` etc.

## Pending Decisions
- Determine caching strategy (e.g., Next.js cached data vs SWR) once data volume known.
- Evaluate incremental static regeneration vs fully dynamic routes; initial build will use dynamic SSR to respect auth gating.
- Choose charting approach compatible with Next+Tailwind and accessible fallback (e.g., Visx, Tremor, or custom d3). Baseline will use lightweight chart component with canvas fallback.

