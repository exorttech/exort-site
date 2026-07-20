begin;

create table if not exists public.qr_sources (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  public_id text not null unique default left(replace(gen_random_uuid()::text, '-', ''), 20),
  source_type text not null default 'qr',
  menu_path text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qr_sources_name_check check (char_length(btrim(name)) between 1 and 100),
  constraint qr_sources_public_id_check check (public_id ~ '^[a-zA-Z0-9_-]{12,64}$'),
  constraint qr_sources_type_check check (source_type in ('qr', 'link', 'social', 'direct'))
);

alter table public.menu_analytics_events add column if not exists qr_source_id uuid references public.qr_sources(id) on delete set null;
alter table public.menu_analytics_events add column if not exists source_fallback text;
alter table public.menu_analytics_events add column if not exists menu_page_id text;
alter table public.menu_analytics_events add column if not exists category_id uuid references public.menu_categories(id) on delete set null;
alter table public.menu_analytics_events add column if not exists duration_ms integer;
alter table public.menu_analytics_events add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.menu_analytics_events drop constraint if exists menu_analytics_events_event_type_check;
alter table public.menu_analytics_events add constraint menu_analytics_events_event_type_check
  check (event_type in (
    'menu_open', 'session_start', 'category_view', 'dish_open', 'dish_close',
    'search', 'search_no_results', 'language_change', 'menu_exit'
  ));
alter table public.menu_analytics_events drop constraint if exists menu_analytics_events_language_check;
alter table public.menu_analytics_events add constraint menu_analytics_events_language_check
  check (language is null or language in ('ru', 'kk', 'kz', 'en', 'tr'));
alter table public.menu_analytics_events drop constraint if exists menu_analytics_events_duration_check;
alter table public.menu_analytics_events add constraint menu_analytics_events_duration_check
  check (duration_ms is null or duration_ms between 0 and 86400000);
alter table public.menu_analytics_events drop constraint if exists menu_analytics_events_source_fallback_check;
alter table public.menu_analytics_events add constraint menu_analytics_events_source_fallback_check
  check (source_fallback is null or char_length(source_fallback) <= 120);

create index if not exists qr_sources_restaurant_idx on public.qr_sources (restaurant_id, created_at desc);
create index if not exists qr_sources_public_active_idx on public.qr_sources (public_id) where is_active;
create index if not exists menu_analytics_events_source_created_idx on public.menu_analytics_events (restaurant_id, qr_source_id, created_at desc);
create index if not exists menu_analytics_events_session_event_idx on public.menu_analytics_events (restaurant_id, session_id, event_type, created_at);
create index if not exists menu_analytics_events_category_idx on public.menu_analytics_events (category_id) where category_id is not null;

drop trigger if exists qr_sources_set_updated_at on public.qr_sources;
create trigger qr_sources_set_updated_at
before update on public.qr_sources
for each row execute function public.set_updated_at();

alter table public.qr_sources enable row level security;
grant select, insert, update on public.qr_sources to authenticated;
grant all on public.qr_sources to service_role;

drop policy if exists "Members can read their QR sources" on public.qr_sources;
create policy "Members can read their QR sources"
on public.qr_sources for select to authenticated
using ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can create their QR sources" on public.qr_sources;
create policy "Members can create their QR sources"
on public.qr_sources for insert to authenticated
with check ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can update their QR sources" on public.qr_sources;
create policy "Members can update their QR sources"
on public.qr_sources for update to authenticated
using ((select private.is_restaurant_member(restaurant_id)))
with check ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Public can insert analytics events" on public.menu_analytics_events;
create policy "Public can insert analytics events"
on public.menu_analytics_events for insert to anon, authenticated
with check (
  exists (
    select 1 from public.restaurants restaurant
    where restaurant.id = menu_analytics_events.restaurant_id and restaurant.is_active
  )
  and (
    qr_source_id is null
    or exists (
      select 1 from public.qr_sources source
      where source.id = menu_analytics_events.qr_source_id
        and source.restaurant_id = menu_analytics_events.restaurant_id
        and source.is_active
    )
  )
);

comment on table public.qr_sources is 'Stable public entry points for QR codes and trackable menu links. Sources are archived, not deleted, to retain analytics history.';
comment on column public.menu_analytics_events.duration_ms is 'Duration for dish_close or menu_exit. Menu study time is derived from menu_exit duration per session.';
comment on column public.menu_analytics_events.source_fallback is 'Backward-compatible source label. Events without qr_source_id are treated as direct or unknown.';

commit;
