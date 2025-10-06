begin;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'reaction_type'
      and n.nspname = 'portal'
  ) then
    create type portal.reaction_type as enum (
      'like',
      'love',
      'hooray',
      'rocket',
      'eyes',
      'laugh',
      'confused',
      'sad',
      'angry',
      'minus_one'
    );
  end if;
end;
$$;

alter table portal.votes
  add column if not exists reaction portal.reaction_type not null default 'like';

alter table portal.plan_update_votes
  add column if not exists reaction portal.reaction_type not null default 'like';

create or replace function portal.refresh_idea_stats(p_idea_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'portal', 'public'
as $function$
begin
  update portal.ideas i
  set vote_count = coalesce((
      select count(*)
      from portal.votes v
      where v.idea_id = p_idea_id
        and v.reaction in ('like','love','hooray','rocket','eyes','laugh')
    ), 0),
    comment_count = coalesce((select count(*) from portal.comments c where c.idea_id = p_idea_id), 0),
    flag_count = coalesce((select count(*) from portal.flags f where f.idea_id = p_idea_id), 0),
    last_activity_at = greatest(
      i.created_at,
      coalesce((select max(created_at) from portal.comments c where c.idea_id = p_idea_id), i.created_at),
      coalesce((select max(created_at) from portal.idea_edits e where e.idea_id = p_idea_id), i.created_at)
    ),
    updated_at = portal.now_toronto()
  where i.id = p_idea_id;
end;
$function$;

create or replace view portal.idea_reaction_totals as
select
  v.idea_id,
  v.reaction,
  count(*)::bigint as reaction_count
from portal.votes v
group by v.idea_id, v.reaction;

alter view portal.idea_reaction_totals set (security_invoker = true);

grant select on portal.idea_reaction_totals to authenticated, anon;

create or replace view portal.plan_update_reaction_totals as
select
  v.plan_update_id,
  v.reaction,
  count(*)::bigint as reaction_count
from portal.plan_update_votes v
group by v.plan_update_id, v.reaction;

alter view portal.plan_update_reaction_totals set (security_invoker = true);

grant select on portal.plan_update_reaction_totals to authenticated, anon;

update portal.ideas i
set vote_count = coalesce((
    select count(*)
    from portal.votes v
    where v.idea_id = i.id
      and v.reaction in ('like','love','hooray','rocket','eyes','laugh')
  ), 0);

commit;
