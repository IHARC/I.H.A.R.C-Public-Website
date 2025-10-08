truncate table portal.metric_daily;

alter table portal.metric_daily drop constraint if exists metric_daily_value_required;
drop index if exists portal_metric_daily_pk;

alter table portal.metric_daily drop column if exists metric_key;

drop type if exists portal.metric_key;

create table portal.metric_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  unit text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default portal.now_toronto(),
  updated_at timestamptz not null default portal.now_toronto()
);

alter table portal.metric_daily
  add column metric_id uuid not null references portal.metric_catalog(id) on delete cascade;

create unique index portal_metric_daily_pk on portal.metric_daily (metric_date, metric_id);

alter table portal.metric_daily
  add constraint metric_daily_value_required
  check (
    (value_status = 'reported' and value is not null)
    or (value_status = 'pending')
  );

alter table portal.metric_daily
  alter column value drop not null;

alter table portal.metric_daily
  alter column value_status set default 'reported';

alter table portal.metric_catalog enable row level security;

create policy portal_metric_catalog_select_public
  on portal.metric_catalog
  for select
  using (true);

create policy portal_metric_catalog_admin_write
  on portal.metric_catalog
  for insert
  with check (portal.current_role_in(ARRAY['admin'::portal.profile_role]));

create policy portal_metric_catalog_admin_update
  on portal.metric_catalog
  for update
  using (portal.current_role_in(ARRAY['admin'::portal.profile_role]))
  with check (portal.current_role_in(ARRAY['admin'::portal.profile_role]));

create policy portal_metric_catalog_admin_delete
  on portal.metric_catalog
  for delete
  using (portal.current_role_in(ARRAY['admin'::portal.profile_role]));

insert into portal.metric_catalog (slug, label, unit, sort_order)
values
  ('outdoor_count', 'Neighbours Outdoors', null, 10),
  ('shelter_occupancy', 'Shelter Occupancy (%)', '%', 20),
  ('overdoses_reported', 'Drug Poisoning Emergencies', null, 30),
  ('narcan_distributed', 'Naloxone Kits Shared', null, 40),
  ('encampment_count', 'Encampment Sites Documented', null, 50),
  ('warming_beds_available', 'Warming Beds Available', null, 60);
