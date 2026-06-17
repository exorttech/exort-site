-- Exort admin production migration.
-- Safe to run in Supabase SQL Editor after the current seed/schema.

begin;

alter table if exists public.restaurants
  add column if not exists hero_image_url text,
  add column if not exists menu_cover_url text;

alter table if exists public.menu_items
  add column if not exists is_stoplisted boolean not null default false,
  add column if not exists inactive_until timestamptz,
  add column if not exists image_path text,
  add column if not exists version int not null default 1;

create index if not exists menu_items_restaurant_stoplisted_idx
  on public.menu_items (restaurant_id, is_stoplisted);

create index if not exists menu_items_restaurant_inactive_until_idx
  on public.menu_items (restaurant_id, inactive_until);

comment on column public.menu_items.is_stoplisted is
  'When true, the dish remains visible in the public menu but is shown as temporarily unavailable.';

comment on column public.menu_items.inactive_until is
  'Optional temporary unavailable timestamp. Past values are treated as available again by the frontend.';

comment on column public.restaurants.hero_image_url is
  'Optional public cover image for the restaurant menu hero.';

comment on column public.restaurants.menu_cover_url is
  'Optional alias for the public menu cover image.';

-- The public menu must show inactive / stoplisted / temporarily unavailable dishes
-- with a badge instead of hiding them. Restaurant and category boundaries still apply.
drop policy if exists "Public can read active menu items" on public.menu_items;
drop policy if exists "MVP public can read active menu items" on public.menu_items;
drop policy if exists "Public can read menu items for active restaurants" on public.menu_items;

create policy "Public can read menu items for active restaurants"
on public.menu_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.restaurants restaurant
    where restaurant.id = menu_items.restaurant_id
      and restaurant.is_active = true
  )
  and (
    menu_items.category_id is null
    or exists (
      select 1
      from public.menu_categories category
      where category.id = menu_items.category_id
        and category.restaurant_id = menu_items.restaurant_id
        and category.is_active = true
    )
  )
);

-- Demo-only hash for PIN 1234 using sha256. Production should replace this with
-- a backend-generated bcrypt/argon2 hash and never store a plain PIN.
update public.restaurant_admin_access access
set
  pin_hash = 'sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  updated_at = now()
from public.restaurants restaurant
where access.restaurant_id = restaurant.id
  and restaurant.slug = 'exort-demo'
  and access.pin_hash = 'demo_hash_1234';

commit;
