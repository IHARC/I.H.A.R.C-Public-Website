create type portal.metric_value_status as enum ('reported', 'pending');

alter table portal.metric_daily
  add column value_status portal.metric_value_status not null default 'reported';

alter table portal.metric_daily
  alter column value drop not null;

alter table portal.metric_daily
  add constraint metric_daily_value_required
  check (
    (value_status = 'reported' and value is not null)
    or (value_status = 'pending')
  );
