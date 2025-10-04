begin;

create type portal.affiliation_type as enum ('community_member','agency_partner','government_partner');
create type portal.affiliation_status as enum ('approved','pending','revoked');
create type portal.invite_status as enum ('pending','accepted','cancelled','expired');

alter table portal.profiles
  add column position_title text,
  add column affiliation_type portal.affiliation_type not null default 'community_member',
  add column affiliation_status portal.affiliation_status not null default 'approved',
  add column affiliation_requested_at timestamptz,
  add column affiliation_reviewed_at timestamptz,
  add column affiliation_reviewed_by uuid references portal.profiles(id);

create table portal.profile_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  position_title text,
  affiliation_type portal.affiliation_type not null,
  organization_id uuid references portal.organizations(id),
  message text,
  status portal.invite_status not null default 'pending',
  token uuid not null default gen_random_uuid(),
  invited_by_profile_id uuid references portal.profiles(id),
  invited_by_user_id uuid references auth.users(id),
  user_id uuid references auth.users(id),
  profile_id uuid references portal.profiles(id),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profile_invites_token_key on portal.profile_invites(token);
create index profile_invites_email_idx on portal.profile_invites(lower(email));
create index profile_invites_status_idx on portal.profile_invites(status);

create trigger set_profile_invites_updated_at
  before update on portal.profile_invites
  for each row
  execute function portal.set_updated_at();

alter table portal.profile_invites enable row level security;

create policy portal_profile_invites_admin
  on portal.profile_invites
  for all
  using (portal.current_role_in(ARRAY['admin'::portal.profile_role]))
  with check (portal.current_role_in(ARRAY['admin'::portal.profile_role]));

commit;
