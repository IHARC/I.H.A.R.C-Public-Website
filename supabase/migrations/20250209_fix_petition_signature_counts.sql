create or replace function portal.petition_signature_totals_public()
returns table (
  petition_id uuid,
  signature_count bigint,
  first_signed_at timestamptz,
  last_signed_at timestamptz
)
language sql
security definer
set search_path = portal, public
as $$
  select
    s.petition_id,
    count(*) filter (where s.withdrawn_at is null) as signature_count,
    min(s.created_at) filter (where s.withdrawn_at is null) as first_signed_at,
    max(s.created_at) filter (where s.withdrawn_at is null) as last_signed_at
  from portal.petition_signatures as s
  group by s.petition_id;
$$;

grant execute on function portal.petition_signature_totals_public() to anon, authenticated;

create or replace view portal.petition_signature_totals as
select * from portal.petition_signature_totals_public();
