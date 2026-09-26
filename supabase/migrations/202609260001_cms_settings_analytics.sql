begin;

alter table public.quotes
  add column if not exists details text;

alter table public.site_config
  add column if not exists hero_background_url text;

create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  visitor_id text not null,
  path text not null,
  referrer_url text,
  utm_source text default 'direct',
  utm_medium text,
  utm_campaign text,
  user_agent text,
  constraint analytics_events_path_length check (char_length(path) between 1 and 260),
  constraint analytics_events_visitor_length check (char_length(visitor_id) between 8 and 120)
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_visitor_id_idx
  on public.analytics_events (visitor_id);

create index if not exists analytics_events_path_idx
  on public.analytics_events (path);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;

grant select, insert, update, delete on table public.analytics_events to service_role;

commit;
