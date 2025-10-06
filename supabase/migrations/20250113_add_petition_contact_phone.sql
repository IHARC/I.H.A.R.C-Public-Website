alter table portal.petition_signatures
  add column if not exists phone text,
  alter column email drop not null;

alter table portal.petition_signatures
  drop constraint if exists petition_signatures_contact_check;

alter table portal.petition_signatures
  add constraint petition_signatures_contact_check
  check (email is not null or phone is not null);
