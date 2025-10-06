begin;

create or replace function portal.enforce_profile_protected_fields()
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

  if new.role is distinct from old.role then
    raise exception 'Not permitted to change role';
  end if;

  if new.affiliation_reviewed_at is distinct from old.affiliation_reviewed_at
     or new.affiliation_reviewed_by is distinct from old.affiliation_reviewed_by then
    raise exception 'Not permitted to change review metadata';
  end if;

  if new.government_role_type is distinct from old.government_role_type then
    if not (new.affiliation_type = 'community_member' and new.government_role_type is null) then
      raise exception 'Not permitted to change government role classification';
    end if;
  end if;

  if new.affiliation_type = 'community_member' then
    if new.affiliation_status <> 'approved' then
      raise exception 'Community members must remain approved';
    end if;
    if new.organization_id is not null then
      raise exception 'Community members cannot link organizations';
    end if;
    return new;
  end if;

  if new.affiliation_type <> old.affiliation_type and new.affiliation_status <> 'pending' then
    raise exception 'Affiliation changes require moderator approval';
  end if;

  if new.affiliation_status not in ('pending', old.affiliation_status) then
    raise exception 'Affiliation status change not permitted';
  end if;

  if new.affiliation_status <> 'pending' and new.organization_id is distinct from old.organization_id then
    raise exception 'Organization cannot change without moderator approval';
  end if;

  return new;
end;
$$;

commit;
