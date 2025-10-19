# Point-in-Time Count Ingestion Guide

This document explains how external tools can create and update point-in-time (P.I.T.) counts in Supabase without exposing personally identifying information. The integration targets the `core.pit_counts` and `core.pit_count_observations` tables introduced for the IHARC Portal.

## Overview

- **Schema:** `core`
- **Tables:**
  - `pit_counts` — metadata for each count window.
  - `pit_count_observations` — anonymized encounter details captured during the count.
- **Views for public display:**
  - `portal.pit_public_summary`
  - `portal.pit_public_breakdowns`
- **Row Level Security:** enabled on both tables. Writes require an authenticated IHARC service identity (`is_iharc_user()`), and deletes additionally require `check_iharc_admin_role()` or an explicit permission. Anonymous access is denied.

## Authentication & Authorization

1. Use a Supabase service role key or a server-side Supabase client that runs with IHARC staff credentials. Never embed these credentials in the public web app.
2. Ensure the authenticated role satisfies `is_iharc_user()`. This is handled automatically for the IHARC service-role and for authenticated moderators.
3. When running automated ingestion, prefer a dedicated machine user so audit logs clearly distinguish automation from manual entries.

## Creating a Count Window

Insert a record into `core.pit_counts` before the field team heads out.

```sql
insert into core.pit_counts (
  slug,
  title,
  description,
  status,
  observed_start,
  municipality,
  methodology,
  external_reference,
  lead_profile_id
) values (
  '2024-10-18-weekend',
  'October weekend outreach blitz',
  'County housing, peer outreach, and IHARC neighbours completed a joined-up PIT route.',
  'active',
  timezone('utc', now()),
  'Northumberland County',
  'Standardized PIT instrument with trauma-informed intake.',
  'pit-2024-10-18',
  '00000000-0000-0000-0000-000000000000' -- optional portal profile UUID
);
```

- `slug` must be unique and is used by the portal to link to the count.
- `status` options: `planned`, `active`, `closed`.
- `observed_start` / `observed_end` should use UTC timestamps; the UI converts to Toronto time.
- You can store a system identifier in `external_reference` to map back to the originating tool.

When the window closes, update the same row:

```sql
update core.pit_counts
set status = 'closed', observed_end = timezone('utc', now())
where slug = '2024-10-18-weekend';
```

Counts left in the `active` state appear as “live” on the marketing page, while `closed` counts remain in the archive.

## Recording Observations

Each encounter during the count is stored in `core.pit_count_observations`. Columns mirror the intake instrument while preventing PII from leaving the field device.

| Column | Notes |
| --- | --- |
| `pit_count_id` | Required. FK to `core.pit_counts.id`. |
| `external_id` | Optional but recommended. Unique per count to support idempotent imports. |
| `person_id` | Optional FK to `core.people.id` when consent allows a linkage. Leave `NULL` if not applicable. |
| `observed_at` | Defaults to `now()`. Use UTC timestamps. |
| `location_type` | Enum: `encampment`, `shelter`, `street`, `vehicle`, `motel`, `couch_surfing`, `institutional`, `other`, `unknown`. |
| `age_bracket` | Enum: `under_19`, `age_20_39`, `age_40_59`, `age_60_plus`, `unknown`. |
| `gender` | Re-uses `core.gender_enum`. |
| `addiction_response`, `mental_health_response`, `homelessness_response` | Enum: `yes`, `no`, `maybe`, `unknown`, `not_answered`. |
| `addiction_severity`, `mental_health_severity` | Enum: `none`, `mild`, `moderate`, `severe`, `critical`, `unknown`, `not_recorded`. |
| `willing_to_engage` | Enum: `ready_now`, `ready_with_supports`, `needs_follow_up`, `declined`, `not_suitable`, `not_assessed`, `unknown`. |
| `metadata` | JSONB for instrument-specific extras (must be structured, no raw PII). |

Example insert:

```sql
insert into core.pit_count_observations (
  pit_count_id,
  external_id,
  location_type,
  age_bracket,
  gender,
  addiction_response,
  addiction_severity,
  mental_health_response,
  mental_health_severity,
  homelessness_response,
  willing_to_engage,
  metadata
) values (
  '00000000-0000-0000-0000-000000000000',
  'field-device-42',
  'street',
  'age_20_39',
  'Non-binary',
  'yes',
  'moderate',
  'no',
  'not_recorded',
  'yes',
  'ready_with_supports',
  jsonb_build_object('notes', 'Requested RAAM follow-up and warming supplies')
)
on conflict (pit_count_id, external_id) do update set
  addiction_response = excluded.addiction_response,
  addiction_severity = excluded.addiction_severity,
  mental_health_response = excluded.mental_health_response,
  mental_health_severity = excluded.mental_health_severity,
  homelessness_response = excluded.homelessness_response,
  willing_to_engage = excluded.willing_to_engage,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
```

### Linking to People Records

- Only set `person_id` when the individual has opted in to ongoing support and the linkage is necessary for case coordination.
- If you provide `person_id`, ensure the ingestion account also has permissions to read that `core.people` row; otherwise the insert will fail due to RLS.
- Never store names, initials, phone numbers, or other direct identifiers in `pit_count_observations` columns.

## Enumerations Reference

All enums live in the `core` schema. Import them directly from Supabase when building form controls so future iterations stay in sync.

```sql
select enumlabel
from pg_enum
where enumtypid = 'core.pit_support_readiness'::regtype
order by enumsortorder;
```

## Consuming Aggregated Data

The marketing site and portal read from two public-safe views:

- `portal.pit_public_summary` — one row per count with totals (neighbours counted, support readiness, substance use / mental health flags, etc.).
- `portal.pit_public_breakdowns` — dimensioned aggregates by age, gender, readiness, and severity. Counts < 3 are suppressed; `percentage` is `NULL` when suppressed.

Anonymous readers can `SELECT` from these views, so public dashboards and partners do not need elevated credentials.

## Multiple Counts & Scheduling

- Each count window should have a unique `slug` and `external_reference`.
- You can keep a future-dated row in `planned` status; once field work starts, toggle to `active` so the marketing page advertises the live count.
- When running weekly counts, prefer ISO-formatted slugs such as `2024-w43-downtown` for easy sorting.

## Validation Checklist for Integrators

- [ ] Create or reuse an IHARC service account with `is_iharc_user()` permissions.
- [ ] Insert a `pit_counts` row before writing observations.
- [ ] Provide a unique `external_id` per observation to support retries.
- [ ] Map survey answers to the enums listed above; trim whitespace and normalise casing.
- [ ] Set `status = 'closed'` and `observed_end` when the validation team signs off.
- [ ] Monitor Supabase logs for RLS violations or constraint errors during early test runs.

Following these steps ensures the live dashboard stays accurate while respecting the dignity and privacy of neighbours who participate in the count.
