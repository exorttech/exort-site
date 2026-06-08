-- Exort multi-tenant Supabase schema
-- Run this file in the Supabase SQL Editor as a project owner.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_name_not_blank_check check (btrim(name) <> ''),
  constraint restaurants_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$')
);

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint restaurant_members_restaurant_user_key unique (restaurant_id, user_id)
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title_ru text not null,
  title_en text,
  title_kk text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_categories_title_ru_not_blank_check check (btrim(title_ru) <> '')
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  content_key text not null,
  title_ru text not null,
  title_en text,
  title_kk text,
  description_ru text,
  description_en text,
  description_kk text,
  price numeric(10, 2),
  currency text not null default '₸',
  image_url text,
  image_path text,
  badge_ru text,
  badge_en text,
  badge_kk text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  inactive_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_content_key_format_check
    check (content_key = lower(content_key) and content_key ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  constraint menu_items_title_ru_not_blank_check check (btrim(title_ru) <> ''),
  constraint menu_items_currency_not_blank_check check (btrim(currency) <> ''),
  constraint menu_items_price_nonnegative_check check (price is null or price >= 0)
);

-- Upgrade path for databases created by an earlier version of this file.
alter table public.menu_items add column if not exists content_key text;
update public.menu_items
set content_key = 'item-' || replace(id::text, '-', '')
where content_key is null or btrim(content_key) = '';
alter table public.menu_items alter column content_key set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_content_key_format_check'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_content_key_format_check
      check (content_key = lower(content_key) and content_key ~ '^[a-z0-9][a-z0-9-]{0,79}$');
  end if;
end;
$$;

-- restaurants.slug already has a unique btree index from its UNIQUE constraint.
create index if not exists menu_categories_restaurant_id_idx
  on public.menu_categories (restaurant_id);
create index if not exists menu_categories_restaurant_sort_order_idx
  on public.menu_categories (restaurant_id, sort_order);
create index if not exists menu_items_restaurant_id_idx
  on public.menu_items (restaurant_id);
create index if not exists menu_items_category_id_idx
  on public.menu_items (category_id);
create index if not exists menu_items_restaurant_category_sort_order_idx
  on public.menu_items (restaurant_id, category_id, sort_order);
create unique index if not exists menu_items_restaurant_content_key_uidx
  on public.menu_items (restaurant_id, content_key);
create index if not exists menu_items_public_listing_idx
  on public.menu_items (restaurant_id, category_id, sort_order)
  where is_active;
create index if not exists menu_categories_public_listing_idx
  on public.menu_categories (restaurant_id, sort_order)
  where is_active;
create index if not exists restaurant_members_user_id_idx
  on public.restaurant_members (user_id);
create index if not exists restaurant_members_restaurant_id_idx
  on public.restaurant_members (restaurant_id);

comment on table public.restaurants is
  'Restaurant tenants. The slug maps to the restaurant subdomain.';
comment on column public.restaurants.slug is
  'Stable lowercase subdomain identifier, for example tekemet in tekemet.exort.kz.';
comment on table public.restaurant_members is
  'Membership links between Supabase Auth users and restaurants. Membership grants full restaurant management access.';
comment on table public.menu_categories is
  'Ordered menu categories owned by one restaurant.';
comment on table public.menu_items is
  'Menu items owned by one restaurant, optionally assigned to a category.';
comment on column public.menu_items.content_key is
  'Stable restaurant-scoped item identifier for rendering, imports, and future CRUD operations.';
comment on column public.menu_items.inactive_until is
  'When set in the future, temporarily hides the item from the public menu until this timestamp.';
comment on column public.menu_items.image_path is
  'Object path inside the restaurant-assets bucket, for example exort-demo/menu-items/photo.webp.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists menu_categories_set_updated_at on public.menu_categories;
create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

-- Prevent a menu item from referencing a category owned by another restaurant.
create or replace function public.validate_menu_item_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.menu_categories category
    where category.id = new.category_id
      and category.restaurant_id = new.restaurant_id
  ) then
    raise exception 'menu item category must belong to the same restaurant';
  end if;

  return new;
end;
$$;

drop trigger if exists menu_items_validate_category on public.menu_items;
create trigger menu_items_validate_category
before insert or update of restaurant_id, category_id on public.menu_items
for each row execute function public.validate_menu_item_category();

-- SECURITY DEFINER avoids recursive RLS checks on restaurant_members.
-- These helpers live outside the exposed public API schema.
create or replace function private.is_restaurant_member(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = p_restaurant_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_manage_restaurant_slug(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurants restaurant
    join public.restaurant_members member
      on member.restaurant_id = restaurant.id
    where restaurant.slug = p_slug
      and member.user_id = (select auth.uid())
  );
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on function private.is_restaurant_member(uuid) from public, anon, authenticated;
revoke all on function private.can_manage_restaurant_slug(text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_restaurant_member(uuid) to authenticated;
grant execute on function private.can_manage_restaurant_slug(text) to authenticated;

alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.restaurants to anon, authenticated;
grant select on public.menu_categories to anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant select on public.restaurant_members to authenticated;
grant insert, update, delete on public.menu_categories to authenticated;
grant insert, update, delete on public.menu_items to authenticated;

drop policy if exists "Public can read active restaurants" on public.restaurants;
create policy "Public can read active restaurants"
on public.restaurants for select
to anon, authenticated
using (is_active);

drop policy if exists "Members can read their restaurants" on public.restaurants;
create policy "Members can read their restaurants"
on public.restaurants for select
to authenticated
using ((select private.is_restaurant_member(id)));

drop policy if exists "Users can read their memberships" on public.restaurant_members;
create policy "Users can read their memberships"
on public.restaurant_members for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Public can read active categories" on public.menu_categories;
create policy "Public can read active categories"
on public.menu_categories for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.restaurants restaurant
    where restaurant.id = menu_categories.restaurant_id
      and restaurant.is_active
  )
);

drop policy if exists "Members can read their categories" on public.menu_categories;
create policy "Members can read their categories"
on public.menu_categories for select
to authenticated
using ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can create their categories" on public.menu_categories;
create policy "Members can create their categories"
on public.menu_categories for insert
to authenticated
with check ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can update their categories" on public.menu_categories;
create policy "Members can update their categories"
on public.menu_categories for update
to authenticated
using ((select private.is_restaurant_member(restaurant_id)))
with check ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can delete their categories" on public.menu_categories;
create policy "Members can delete their categories"
on public.menu_categories for delete
to authenticated
using ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Public can read active menu items" on public.menu_items;
create policy "Public can read active menu items"
on public.menu_items for select
to anon, authenticated
using (
  is_active
  and (inactive_until is null or inactive_until <= now())
  and exists (
    select 1
    from public.restaurants restaurant
    where restaurant.id = menu_items.restaurant_id
      and restaurant.is_active
  )
  and (
    category_id is null
    or exists (
      select 1
      from public.menu_categories category
      where category.id = menu_items.category_id
        and category.restaurant_id = menu_items.restaurant_id
        and category.is_active
    )
  )
);

drop policy if exists "Members can read their menu items" on public.menu_items;
create policy "Members can read their menu items"
on public.menu_items for select
to authenticated
using ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can create their menu items" on public.menu_items;
create policy "Members can create their menu items"
on public.menu_items for insert
to authenticated
with check ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can update their menu items" on public.menu_items;
create policy "Members can update their menu items"
on public.menu_items for update
to authenticated
using ((select private.is_restaurant_member(restaurant_id)))
with check ((select private.is_restaurant_member(restaurant_id)));

drop policy if exists "Members can delete their menu items" on public.menu_items;
create policy "Members can delete their menu items"
on public.menu_items for delete
to authenticated
using ((select private.is_restaurant_member(restaurant_id)));

-- Storage bucket and policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-assets',
  'restaurant-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read restaurant assets" on storage.objects;
create policy "Public can read restaurant assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'restaurant-assets');

drop policy if exists "Members can upload restaurant assets" on storage.objects;
create policy "Members can upload restaurant assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'restaurant-assets'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[2] in ('menu-items', 'logos')
  and (select private.can_manage_restaurant_slug((storage.foldername(name))[1]))
);

drop policy if exists "Members can update restaurant assets" on storage.objects;
create policy "Members can update restaurant assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'restaurant-assets'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[2] in ('menu-items', 'logos')
  and (select private.can_manage_restaurant_slug((storage.foldername(name))[1]))
)
with check (
  bucket_id = 'restaurant-assets'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[2] in ('menu-items', 'logos')
  and (select private.can_manage_restaurant_slug((storage.foldername(name))[1]))
);

drop policy if exists "Members can delete restaurant assets" on storage.objects;
create policy "Members can delete restaurant assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'restaurant-assets'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[2] in ('menu-items', 'logos')
  and (select private.can_manage_restaurant_slug((storage.foldername(name))[1]))
);

-- Remove helper functions from the exposed public schema when upgrading from
-- an earlier version of this schema. All policies above now use private.*.
drop function if exists public.is_restaurant_member(uuid);
drop function if exists public.can_manage_restaurant_slug(text);

-- Seed restaurant.
insert into public.restaurants (slug, name, is_active)
values ('exort-demo', 'Exort Demo', true)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active;

insert into public.menu_categories (
  restaurant_id,
  title_ru,
  title_en,
  title_kk,
  sort_order,
  is_active
)
select
  restaurant.id,
  category.title_ru,
  category.title_en,
  category.title_kk,
  category.sort_order,
  true
from public.restaurants restaurant
cross join (
  values
    ('Завтраки', 'Breakfasts', 'Таңғы ас', 10),
    ('Салаты', 'Salads', 'Салаттар', 20),
    ('Основные блюда', 'Main courses', 'Негізгі тағамдар', 30),
    ('Напитки', 'Drinks', 'Сусындар', 40),
    ('Десерты', 'Desserts', 'Десерттер', 50)
) as category(title_ru, title_en, title_kk, sort_order)
where restaurant.slug = 'exort-demo'
  and not exists (
    select 1
    from public.menu_categories existing
    where existing.restaurant_id = restaurant.id
      and existing.title_ru = category.title_ru
  );

insert into public.menu_items (
  restaurant_id,
  category_id,
  content_key,
  title_ru,
  title_en,
  title_kk,
  description_ru,
  price,
  sort_order,
  is_active
)
select
  restaurant.id,
  category.id,
  item.content_key,
  item.title_ru,
  item.title_en,
  item.title_kk,
  item.description_ru,
  item.price,
  item.sort_order,
  true
from public.restaurants restaurant
join (
  values
    ('Завтраки', 'english-breakfast', 'Английский завтрак', 'English breakfast', 'Ағылшын таңғы асы', 'Яйца, колбаски, фасоль, томаты и тост.', 3900.00, 10),
    ('Салаты', 'chicken-caesar', 'Цезарь с курицей', 'Chicken Caesar', 'Тауық еті қосылған Цезарь', 'Курица, салат романо, пармезан и соус Цезарь.', 3200.00, 10),
    ('Основные блюда', 'ribeye-steak', 'Стейк рибай', 'Ribeye steak', 'Рибай стейкі', 'Стейк рибай с овощами и фирменным соусом.', 8900.00, 10),
    ('Напитки', 'lemonade', 'Лимонад', 'Lemonade', 'Лимонад', 'Домашний лимонад с цитрусами и мятой.', 1600.00, 10),
    ('Десерты', 'cheesecake', 'Чизкейк', 'Cheesecake', 'Чизкейк', 'Классический чизкейк с ягодным соусом.', 2400.00, 10)
) as item(category_ru, content_key, title_ru, title_en, title_kk, description_ru, price, sort_order)
  on true
join public.menu_categories category
  on category.restaurant_id = restaurant.id
 and category.title_ru = item.category_ru
where restaurant.slug = 'exort-demo'
  and not exists (
    select 1
    from public.menu_items existing
    where existing.restaurant_id = restaurant.id
      and existing.content_key = item.content_key
  );
