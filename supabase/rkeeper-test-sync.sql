-- r_keeper test contour support for Exort
-- Apply after the base schema.

insert into public.restaurants (slug, name, is_active)
values ('rkeeper-test', 'r_keeper Test Restaurant', true)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active;

alter table public.menu_categories
  add column if not exists name_ru text,
  add column if not exists name_kz text,
  add column if not exists name_en text,
  add column if not exists source_system text,
  add column if not exists external_id text,
  add column if not exists sync_metadata jsonb;

alter table public.menu_items
  add column if not exists name_ru text,
  add column if not exists name_kz text,
  add column if not exists name_en text,
  add column if not exists description_kz text,
  add column if not exists source_system text,
  add column if not exists external_id text,
  add column if not exists rkeeper_synced_at timestamptz,
  add column if not exists sync_metadata jsonb;

update public.menu_categories
set name_ru = coalesce(nullif(btrim(name_ru), ''), title_ru),
    name_kz = coalesce(nullif(btrim(name_kz), ''), title_kk),
    name_en = coalesce(nullif(btrim(name_en), ''), title_en)
where name_ru is null or name_kz is null or name_en is null;

update public.menu_items
set name_ru = coalesce(nullif(btrim(name_ru), ''), title_ru),
    name_kz = coalesce(nullif(btrim(name_kz), ''), title_kk),
    name_en = coalesce(nullif(btrim(name_en), ''), title_en),
    description_kz = coalesce(nullif(btrim(description_kz), ''), description_kk)
where name_ru is null
   or name_kz is null
   or name_en is null
   or description_kz is null;

create index if not exists menu_categories_restaurant_source_external_idx
  on public.menu_categories (restaurant_id, source_system, external_id);

create index if not exists menu_items_restaurant_source_external_idx
  on public.menu_items (restaurant_id, source_system, external_id);

create table if not exists public.rkeeper_sync_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  status text not null,
  connection_status text,
  received_items integer not null default 0,
  updated_items integer not null default 0,
  last_error text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  constraint rkeeper_sync_runs_status_check check (status in ('success', 'error')),
  constraint rkeeper_sync_runs_connection_status_check check (connection_status is null or connection_status in ('connected', 'error', 'pending'))
);

create index if not exists rkeeper_sync_runs_restaurant_created_idx
  on public.rkeeper_sync_runs (restaurant_id, created_at desc);

alter table public.rkeeper_sync_runs enable row level security;

grant select on public.rkeeper_sync_runs to authenticated;
grant all on public.rkeeper_sync_runs to service_role;

drop policy if exists "Members can read their rkeeper sync runs" on public.rkeeper_sync_runs;
create policy "Members can read their rkeeper sync runs"
on public.rkeeper_sync_runs for select
to authenticated
using ((select private.is_restaurant_member(restaurant_id)));
