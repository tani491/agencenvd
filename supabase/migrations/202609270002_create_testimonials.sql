begin;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  rating numeric(2, 1) not null default 5 check (rating >= 1 and rating <= 5),
  comment text not null,
  service_used text not null default 'Nettoyage vapeur',
  avatar_url text,
  is_published boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists testimonials_created_at_idx
  on public.testimonials (created_at desc);

create index if not exists testimonials_published_created_at_idx
  on public.testimonials (created_at desc)
  where is_published = true;

alter table public.testimonials enable row level security;

revoke all on table public.testimonials from anon, authenticated;
grant select on table public.testimonials to anon, authenticated;
grant select, insert, update, delete on table public.testimonials to service_role;

drop policy if exists "Public can read published testimonials" on public.testimonials;
create policy "Public can read published testimonials"
  on public.testimonials
  for select
  to anon, authenticated
  using (is_published = true);

notify pgrst, 'reload schema';

commit;
