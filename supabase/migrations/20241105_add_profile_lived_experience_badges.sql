begin;

create type portal.lived_experience_status as enum ('none', 'current', 'former', 'prefer_not_to_share');

alter table portal.profiles
  add column homelessness_experience portal.lived_experience_status not null default 'none',
  add column substance_use_experience portal.lived_experience_status not null default 'none';

comment on column portal.profiles.homelessness_experience is 'Optional badge indicating current or past homelessness lived experience.';
comment on column portal.profiles.substance_use_experience is 'Optional badge indicating current or past substance use recovery or challenges.';

update portal.profiles
set position_title = 'Member of the public'
where affiliation_type = 'community_member'
  and (position_title is null or trim(position_title) = '');

commit;
