begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  phone text not null,
  location text not null,
  services text[] not null,
  furniture_photo_url text,
  preferred_date date,
  status text default 'pending' check (
    status in ('pending', 'contacted', 'quoted', 'scheduled', 'completed', 'cancelled')
  ),
  utm_source text default 'direct',
  utm_medium text,
  utm_campaign text,
  referrer_url text,
  constraint quotes_full_name_length check (char_length(btrim(full_name)) between 2 and 120),
  constraint quotes_phone_senegal_mobile check (phone ~ '^\+2217[05678][0-9]{7}$'),
  constraint quotes_location_length check (char_length(btrim(location)) between 2 and 160),
  constraint quotes_services_not_empty check (array_length(services, 1) between 1 and 5),
  constraint quotes_services_allowed check (
    services <@ array['canapes', 'matelas', 'tapis', 'auto', 'locaux']::text[]
  ),
  constraint quotes_photo_url_https check (
    furniture_photo_url is null or furniture_photo_url ~ '^https://'
  )
);

create table if not exists public.portfolio_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  category text not null,
  before_media_url text not null,
  after_media_url text not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  is_published boolean default true
);

create table if not exists public.site_config (
  id int primary key default 1,
  logo_url text not null,
  phone_primary text not null default '778609143',
  phone_secondary text not null default '788605633',
  whatsapp_number text not null default '778609143',
  hero_title text,
  constraint single_row check (id = 1)
);

insert into public.site_config (id, logo_url, hero_title)
values (
  1,
  '/logo-nvd.svg',
  'Le spécialiste du nettoyage à vapeur & désinfection écologique au Sénégal.'
)
on conflict (id) do nothing;

create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
create index if not exists quotes_status_created_at_idx on public.quotes (status, created_at desc);
create index if not exists quotes_preferred_date_idx on public.quotes (preferred_date) where preferred_date is not null;
create index if not exists quotes_services_gin_idx on public.quotes using gin (services);
create index if not exists portfolio_items_published_category_idx
  on public.portfolio_items (category, created_at desc)
  where is_published = true;

alter table public.quotes enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.site_config enable row level security;

revoke all on table public.quotes from anon, authenticated;
revoke all on table public.portfolio_items from anon, authenticated;
revoke all on table public.site_config from anon, authenticated;

grant insert on table public.quotes to anon, authenticated;
grant select on table public.portfolio_items to anon, authenticated;
grant select on table public.site_config to anon, authenticated;

grant select, insert, update, delete on table public.quotes to service_role;
grant select, insert, update, delete on table public.portfolio_items to service_role;
grant select, insert, update, delete on table public.site_config to service_role;

drop policy if exists "Public visitors can create quote requests" on public.quotes;
create policy "Public visitors can create quote requests"
on public.quotes
for insert
to anon, authenticated
with check (
  status = 'pending'
  and full_name = btrim(full_name)
  and location = btrim(location)
  and phone ~ '^\+2217[05678][0-9]{7}$'
  and array_length(services, 1) between 1 and 5
  and services <@ array['canapes', 'matelas', 'tapis', 'auto', 'locaux']::text[]
  and (furniture_photo_url is null or furniture_photo_url ~ '^https://')
  and (preferred_date is null or preferred_date >= current_date)
);

drop policy if exists "Published portfolio items are publicly readable" on public.portfolio_items;
create policy "Published portfolio items are publicly readable"
on public.portfolio_items
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Site config is publicly readable" on public.site_config;
create policy "Site config is publicly readable"
on public.site_config
for select
to anon, authenticated
using (id = 1);

commit;
