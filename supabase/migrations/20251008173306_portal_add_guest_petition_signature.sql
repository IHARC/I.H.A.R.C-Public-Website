create or replace function portal.add_guest_petition_signature(
  p_petition_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_postal_code text,
  p_display_preference portal.petition_display_preference default 'full_name',
  p_statement text default null,
  p_share_with_partners boolean default false
)
returns table(signature_id uuid, profile_id uuid)
language plpgsql
security definer
set search_path = portal, public
as $$
declare
  v_now timestamptz := portal.now_toronto();
  v_petition portal.petitions%rowtype;
  v_profile_id uuid;
  v_email_contact_id uuid;
  v_signature_id uuid;
  v_display_name text;
  v_existing_signature_id uuid;
  v_statement text;
  v_postal_code text;
begin
  if p_petition_id is null then
    raise exception using errcode = 'P0001', message = 'petition_id_required';
  end if;

  select *
  into v_petition
  from portal.petitions
  where id = p_petition_id;

  if not found or not coalesce(v_petition.is_active, false) then
    raise exception using errcode = 'P0001', message = 'petition_inactive';
  end if;

  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'first_name_required';
  end if;

  if p_last_name is null or length(trim(p_last_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'last_name_required';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception using errcode = 'P0001', message = 'email_required';
  end if;

  if position('@' in p_email) = 0 then
    raise exception using errcode = 'P0001', message = 'email_invalid';
  end if;

  if p_postal_code is null or length(trim(p_postal_code)) = 0 then
    raise exception using errcode = 'P0001', message = 'postal_code_required';
  end if;

  v_postal_code := upper(trim(p_postal_code));
  if length(v_postal_code) < 3 or length(v_postal_code) > 10 then
    raise exception using errcode = 'P0001', message = 'postal_code_invalid';
  end if;

  if p_display_preference is null then
    p_display_preference := 'full_name';
  end if;

  v_statement := nullif(trim(coalesce(p_statement, '')), '');
  if v_statement is not null and char_length(v_statement) > 500 then
    raise exception using errcode = 'P0001', message = 'statement_too_long';
  end if;

  select ps.id
  into v_existing_signature_id
  from portal.petition_signatures ps
  join portal.profile_contacts pc on pc.id = ps.email_contact_id
  where ps.petition_id = p_petition_id
    and ps.withdrawn_at is null
    and lower(pc.normalized_value) = lower(trim(p_email))
  limit 1;

  if v_existing_signature_id is not null then
    raise exception using errcode = 'P0001', message = 'signature_already_exists';
  end if;

  v_display_name := trim(p_first_name || ' ' || p_last_name);

  insert into portal.profiles (
    user_id,
    display_name,
    organization_id,
    role,
    bio,
    avatar_url,
    rules_acknowledged_at,
    position_title,
    affiliation_type,
    affiliation_status,
    affiliation_requested_at,
    affiliation_reviewed_at,
    affiliation_reviewed_by,
    homelessness_experience,
    substance_use_experience,
    has_signed_petition,
    petition_signed_at,
    created_at,
    updated_at
  )
  values (
    null,
    coalesce(v_display_name, 'Community Member'),
    null,
    'user',
    null,
    null,
    v_now,
    'Member of the public',
    'community_member',
    'approved',
    v_now,
    v_now,
    null,
    'none',
    'none',
    true,
    v_now,
    v_now,
    v_now
  )
  returning id into v_profile_id;

  insert into portal.profile_contacts (
    profile_id,
    user_id,
    contact_type,
    contact_value,
    normalized_value,
    created_at,
    updated_at
  )
  values (
    v_profile_id,
    null,
    'email',
    trim(p_email),
    lower(trim(p_email)),
    v_now,
    v_now
  )
  returning id into v_email_contact_id;

  insert into portal.petition_signatures (
    petition_id,
    profile_id,
    user_id,
    statement,
    share_with_partners,
    first_name,
    last_name,
    email_contact_id,
    phone_contact_id,
    postal_code,
    display_preference,
    created_at
  )
  values (
    p_petition_id,
    v_profile_id,
    null,
    v_statement,
    coalesce(p_share_with_partners, false),
    trim(p_first_name),
    trim(p_last_name),
    v_email_contact_id,
    null,
    v_postal_code,
    p_display_preference,
    v_now
  )
  returning id into v_signature_id;

  perform public.portal_log_audit_event(
    p_action => 'petition_signed_guest',
    p_entity_type => 'petition',
    p_entity_id => p_petition_id,
    p_meta => jsonb_build_object(
      'signature_id', v_signature_id,
      'display_preference', p_display_preference,
      'share_with_partners', coalesce(p_share_with_partners, false)
    ),
    p_actor_profile_id => null
  );

  return query
  select v_signature_id as signature_id, v_profile_id as profile_id;

exception
  when others then
    if v_profile_id is not null then
      delete from portal.petition_signatures where profile_id = v_profile_id;
      delete from portal.profile_contacts where profile_id = v_profile_id;
      delete from portal.profiles where id = v_profile_id;
    end if;
    raise;
end;
$$;

grant execute on function portal.add_guest_petition_signature(
  uuid,
  text,
  text,
  text,
  text,
  portal.petition_display_preference,
  text,
  boolean
) to anon, authenticated;
