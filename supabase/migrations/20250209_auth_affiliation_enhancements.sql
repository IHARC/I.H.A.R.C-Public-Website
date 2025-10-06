begin;

create type portal.organization_category as enum ('community','government');
create type portal.government_level as enum ('municipal','county','provincial','federal','other');
create type portal.government_role_type as enum ('staff','politician');

alter table portal.organizations
  add column category portal.organization_category not null default 'community';

alter table portal.organizations
  add column government_level portal.government_level;

alter table portal.organizations
  add constraint organizations_government_level_check
    check (
      (category = 'government' and government_level is not null)
      or (category <> 'government' and government_level is null)
    );

alter table portal.profiles
  add column government_role_type portal.government_role_type,
  add column requested_organization_name text,
  add column requested_government_name text,
  add column requested_government_level portal.government_level,
  add column requested_government_role portal.government_role_type;

drop trigger if exists enforce_profile_protected_fields on portal.profiles;

drop function if exists portal.enforce_profile_protected_fields();

create function portal.enforce_profile_protected_fields()
returns trigger
language plpgsql
security definer
set search_path to 'portal','public'
as $$
begin
  if portal.current_role_in(ARRAY['admin'::portal.profile_role, 'moderator'::portal.profile_role]) then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Not authorized to modify profiles';
  end if;

  if auth.uid() <> old.user_id then
    raise exception 'You may only update your own profile';
  end if;

  if new.role is distinct from old.role
     or new.affiliation_type is distinct from old.affiliation_type
     or new.affiliation_status is distinct from old.affiliation_status
     or new.organization_id is distinct from old.organization_id
     or new.government_role_type is distinct from old.government_role_type
     or new.affiliation_reviewed_at is distinct from old.affiliation_reviewed_at
     or new.affiliation_reviewed_by is distinct from old.affiliation_reviewed_by then
    raise exception 'Profile affiliation fields can only be changed by moderators';
  end if;

  return new;
end;
$$;

create trigger enforce_profile_protected_fields
  before update on portal.profiles
  for each row
  execute function portal.enforce_profile_protected_fields();

commit;
