create table if not exists public.team_data (
  collection text not null check (collection in ('instructions', 'schedule', 'timetable', 'members', 'system')),
  id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key (collection, id)
);

alter table public.team_data enable row level security;
revoke all on table public.team_data from anon, authenticated;
grant all on table public.team_data to service_role;
