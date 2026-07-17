-- Exort production schema sync.
-- Safe to run in Supabase SQL Editor. Does not insert demo data.
-- Adds only missing columns/table required by the current frontend + Worker.

create extension if not exists pgcrypto;

alter table public.menu_items
  add column if not exists old_price integer,
  add column if not exists weight text,
  add column if not exists calories integer,
  add column if not exists spice_level text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_old_price_nonnegative_check'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_old_price_nonnegative_check
      check (old_price is null or old_price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_calories_nonnegative_check'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_calories_nonnegative_check
      check (calories is null or calories >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_spice_level_check'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_spice_level_check
      check (spice_level is null or spice_level in ('mild', 'medium', 'hot'));
  end if;
end;
$$;

create table if not exists public.menu_analytics_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  event_type text not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  language text,
  device_type text,
  session_id text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now(),
  constraint menu_analytics_events_event_type_check
    check (event_type in ('menu_open', 'dish_open', 'dish_close', 'language_change')),
  constraint menu_analytics_events_device_type_check
    check (device_type is null or device_type in ('mobile', 'tablet', 'desktop')),
  constraint menu_analytics_events_language_check
    check (language is null or language in ('ru', 'kk', 'kz', 'en')),
  constraint menu_analytics_events_session_length_check
    check (session_id is null or char_length(session_id) <= 120),
  constraint menu_analytics_events_user_agent_length_check
    check (user_agent is null or char_length(user_agent) <= 500),
  constraint menu_analytics_events_referrer_length_check
    check (referrer is null or char_length(referrer) <= 500)
);

alter table public.menu_analytics_events
  drop constraint if exists menu_analytics_events_event_type_check;
alter table public.menu_analytics_events
  add constraint menu_analytics_events_event_type_check
  check (event_type in ('menu_open', 'dish_open', 'dish_close', 'language_change'));

create index if not exists menu_items_restaurant_optional_details_idx
  on public.menu_items (restaurant_id, old_price, calories, spice_level);
create index if not exists menu_analytics_events_restaurant_id_idx
  on public.menu_analytics_events (restaurant_id);
create index if not exists menu_analytics_events_event_type_idx
  on public.menu_analytics_events (event_type);
create index if not exists menu_analytics_events_menu_item_id_idx
  on public.menu_analytics_events (menu_item_id);
create index if not exists menu_analytics_events_created_at_idx
  on public.menu_analytics_events (created_at);
create index if not exists menu_analytics_events_language_idx
  on public.menu_analytics_events (language);
create index if not exists menu_analytics_events_device_type_idx
  on public.menu_analytics_events (device_type);
create index if not exists menu_analytics_events_session_id_idx
  on public.menu_analytics_events (session_id);
create index if not exists menu_analytics_events_restaurant_created_idx
  on public.menu_analytics_events (restaurant_id, created_at desc);

comment on table public.menu_analytics_events is
  'Append-only public menu analytics events. Raw reads are blocked from public clients; admin analytics are aggregated through the backend.';
comment on column public.menu_analytics_events.session_id is
  'Random technical session id stored in sessionStorage. It must not contain personal data.';

alter table public.menu_analytics_events enable row level security;

revoke select, update, delete on public.menu_analytics_events from public, anon, authenticated;
grant insert on public.menu_analytics_events to anon, authenticated;
grant all on public.menu_analytics_events to service_role;

drop policy if exists "MVP public can insert analytics events" on public.menu_analytics_events;
drop policy if exists "Public can insert analytics events" on public.menu_analytics_events;
create policy "MVP public can insert analytics events"
on public.menu_analytics_events
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.restaurants restaurant
    where restaurant.id = menu_analytics_events.restaurant_id
      and restaurant.is_active
  )
);

-- Ask PostgREST/Supabase API to reload schema cache after DDL changes.
notify pgrst, 'reload schema';
