begin;

alter table public.portfolio_items
  add column if not exists is_published boolean default true,
  add column if not exists before_url text,
  add column if not exists after_url text,
  add column if not exists is_hero boolean default false;

update public.portfolio_items
set
  is_published = coalesce(is_published, true),
  before_url = coalesce(before_url, before_media_url),
  after_url = coalesce(after_url, after_media_url),
  is_hero = coalesce(is_hero, false);

create index if not exists portfolio_items_publication_created_at_idx
  on public.portfolio_items (created_at desc)
  where is_published = true;

notify pgrst, 'reload schema';

commit;
