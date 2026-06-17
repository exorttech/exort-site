-- Exort MVP multi-restaurant schema and seed with PIN-based admin access.
-- Ready to run repeatedly in the Supabase SQL Editor.
--
-- IMPORTANT:
-- restaurant_admin_access.pin_hash must only contain a password/PIN hash.
-- The demo value below is intentionally a placeholder. In production, hash and
-- verify PINs through a trusted backend/API. Never expose service_role to a client.

begin;

create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurants
  add column if not exists city text,
  add column if not exists hero_image_url text,
  add column if not exists menu_cover_url text;

create table if not exists public.restaurant_admin_access (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  pin_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_admin_access_restaurant_id_key unique (restaurant_id)
);

-- Upgrade an earlier login/role-based draft to one PIN record per restaurant.
alter table public.restaurant_admin_access
  drop constraint if exists restaurant_admin_access_restaurant_login_key,
  drop column if exists login,
  drop column if exists role;

delete from public.restaurant_admin_access access
using public.restaurant_admin_access duplicate
where access.restaurant_id = duplicate.restaurant_id
  and (
    access.created_at < duplicate.created_at
    or (access.created_at = duplicate.created_at and access.id < duplicate.id)
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurant_admin_access_restaurant_id_key'
      and conrelid = 'public.restaurant_admin_access'::regclass
  ) then
    alter table public.restaurant_admin_access
      add constraint restaurant_admin_access_restaurant_id_key unique (restaurant_id);
  end if;
end;
$$;

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name_ru text not null,
  name_kz text,
  name_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility columns keep the current Exort menu loader working while the
-- frontend migrates from title_* / *_kk to name_* / *_kz.
alter table public.menu_categories
  add column if not exists name_ru text,
  add column if not exists name_kz text,
  add column if not exists name_en text,
  add column if not exists title_ru text,
  add column if not exists title_kk text,
  add column if not exists title_en text;

update public.menu_categories
set
  name_ru = coalesce(nullif(btrim(name_ru), ''), title_ru),
  name_kz = coalesce(nullif(btrim(name_kz), ''), title_kk),
  name_en = coalesce(nullif(btrim(name_en), ''), title_en),
  title_ru = coalesce(nullif(btrim(title_ru), ''), name_ru),
  title_kk = coalesce(nullif(btrim(title_kk), ''), name_kz),
  title_en = coalesce(nullif(btrim(title_en), ''), name_en);

alter table public.menu_categories
  alter column name_ru set not null;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  content_key text not null,
  name_ru text not null,
  name_kz text,
  name_en text,
  description_ru text,
  description_kz text,
  description_en text,
  price integer not null,
  currency text not null default 'KZT',
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_items
  add column if not exists content_key text,
  add column if not exists name_ru text,
  add column if not exists name_kz text,
  add column if not exists name_en text,
  add column if not exists description_kz text,
  add column if not exists version integer not null default 1,
  add column if not exists is_stoplisted boolean not null default false,
  add column if not exists inactive_until timestamptz,
  add column if not exists image_path text,
  add column if not exists title_ru text,
  add column if not exists title_kk text,
  add column if not exists title_en text,
  add column if not exists description_kk text;

update public.menu_items
set
  content_key = coalesce(nullif(btrim(content_key), ''), 'item-' || replace(id::text, '-', '')),
  name_ru = coalesce(nullif(btrim(name_ru), ''), title_ru),
  name_kz = coalesce(nullif(btrim(name_kz), ''), title_kk),
  name_en = coalesce(nullif(btrim(name_en), ''), title_en),
  description_kz = coalesce(nullif(btrim(description_kz), ''), description_kk),
  title_ru = coalesce(nullif(btrim(title_ru), ''), name_ru),
  title_kk = coalesce(nullif(btrim(title_kk), ''), name_kz),
  title_en = coalesce(nullif(btrim(title_en), ''), name_en),
  description_kk = coalesce(nullif(btrim(description_kk), ''), description_kz),
  currency = coalesce(nullif(btrim(currency), ''), 'KZT'),
  version = greatest(coalesce(version, 1), 1);

update public.menu_items
set price = 0
where price is null;

alter table public.menu_items
  alter column price type integer using round(price)::integer,
  alter column price set not null,
  alter column currency set default 'KZT',
  alter column content_key set not null,
  alter column name_ru set not null,
  alter column version set default 1,
  alter column version set not null;

create unique index if not exists menu_categories_restaurant_name_ru_uidx
  on public.menu_categories (restaurant_id, name_ru);
create unique index if not exists menu_items_restaurant_content_key_uidx
  on public.menu_items (restaurant_id, content_key);
create index if not exists menu_categories_restaurant_sort_order_idx
  on public.menu_categories (restaurant_id, sort_order);
create index if not exists menu_items_restaurant_category_sort_order_idx
  on public.menu_items (restaurant_id, category_id, sort_order);
create index if not exists menu_items_restaurant_stoplisted_idx
  on public.menu_items (restaurant_id, is_stoplisted);
create index if not exists menu_items_restaurant_inactive_until_idx
  on public.menu_items (restaurant_id, inactive_until);

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

create or replace function public.sync_menu_category_names()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.name_ru = coalesce(nullif(btrim(new.name_ru), ''), new.title_ru);
    new.name_kz = coalesce(nullif(btrim(new.name_kz), ''), new.title_kk);
    new.name_en = coalesce(nullif(btrim(new.name_en), ''), new.title_en);
    new.title_ru = coalesce(nullif(btrim(new.title_ru), ''), new.name_ru);
    new.title_kk = coalesce(nullif(btrim(new.title_kk), ''), new.name_kz);
    new.title_en = coalesce(nullif(btrim(new.title_en), ''), new.name_en);
  else
    if new.name_ru is distinct from old.name_ru then
      new.title_ru = new.name_ru;
    elsif new.title_ru is distinct from old.title_ru then
      new.name_ru = new.title_ru;
    end if;

    if new.name_kz is distinct from old.name_kz then
      new.title_kk = new.name_kz;
    elsif new.title_kk is distinct from old.title_kk then
      new.name_kz = new.title_kk;
    end if;

    if new.name_en is distinct from old.name_en then
      new.title_en = new.name_en;
    elsif new.title_en is distinct from old.title_en then
      new.name_en = new.title_en;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_menu_item_names()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.name_ru = coalesce(nullif(btrim(new.name_ru), ''), new.title_ru);
    new.name_kz = coalesce(nullif(btrim(new.name_kz), ''), new.title_kk);
    new.name_en = coalesce(nullif(btrim(new.name_en), ''), new.title_en);
    new.description_kz = coalesce(nullif(btrim(new.description_kz), ''), new.description_kk);
    new.title_ru = coalesce(nullif(btrim(new.title_ru), ''), new.name_ru);
    new.title_kk = coalesce(nullif(btrim(new.title_kk), ''), new.name_kz);
    new.title_en = coalesce(nullif(btrim(new.title_en), ''), new.name_en);
    new.description_kk = coalesce(nullif(btrim(new.description_kk), ''), new.description_kz);
  else
    if new.name_ru is distinct from old.name_ru then
      new.title_ru = new.name_ru;
    elsif new.title_ru is distinct from old.title_ru then
      new.name_ru = new.title_ru;
    end if;

    if new.name_kz is distinct from old.name_kz then
      new.title_kk = new.name_kz;
    elsif new.title_kk is distinct from old.title_kk then
      new.name_kz = new.title_kk;
    end if;

    if new.name_en is distinct from old.name_en then
      new.title_en = new.name_en;
    elsif new.title_en is distinct from old.title_en then
      new.name_en = new.title_en;
    end if;

    if new.description_kz is distinct from old.description_kz then
      new.description_kk = new.description_kz;
    elsif new.description_kk is distinct from old.description_kk then
      new.description_kz = new.description_kk;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists restaurant_admin_access_set_updated_at on public.restaurant_admin_access;
create trigger restaurant_admin_access_set_updated_at
before update on public.restaurant_admin_access
for each row execute function public.set_updated_at();

drop trigger if exists menu_categories_set_updated_at on public.menu_categories;
create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

drop trigger if exists menu_categories_sync_names on public.menu_categories;
create trigger menu_categories_sync_names
before insert or update of name_ru, name_kz, name_en, title_ru, title_kk, title_en
on public.menu_categories
for each row execute function public.sync_menu_category_names();

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

drop trigger if exists menu_items_sync_names on public.menu_items;
create trigger menu_items_sync_names
before insert or update of
  name_ru, name_kz, name_en, title_ru, title_kk, title_en, description_kz, description_kk
on public.menu_items
for each row execute function public.sync_menu_item_names();

comment on table public.restaurant_admin_access is
  'One MVP PIN credential per restaurant. Read and verify only through a trusted backend using service_role.';
comment on column public.restaurant_admin_access.pin_hash is
  'Hashed PIN only. Production PINs must be hashed and verified through a trusted backend/API.';
comment on column public.menu_items.version is
  'Increment for optimistic concurrency control when the administrative panel updates an item.';

alter table public.restaurants enable row level security;
alter table public.restaurant_admin_access enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;

-- Replace all policies on the MVP tables so a previous Auth-based schema cannot
-- accidentally preserve public or authenticated write access.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'restaurants',
        'restaurant_admin_access',
        'menu_categories',
        'menu_items'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

revoke all on public.restaurant_admin_access from public, anon, authenticated;
revoke insert, update, delete on public.restaurants from public, anon, authenticated;
revoke insert, update, delete on public.menu_categories from public, anon, authenticated;
revoke insert, update, delete on public.menu_items from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.restaurants to anon, authenticated;
grant select on public.menu_categories to anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant all on public.restaurants to service_role;
grant all on public.restaurant_admin_access to service_role;
grant all on public.menu_categories to service_role;
grant all on public.menu_items to service_role;

create policy "MVP public can read active restaurants"
on public.restaurants
for select
to anon, authenticated
using (is_active);

create policy "MVP public can read active categories"
on public.menu_categories
for select
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

create policy "MVP public can read active menu items"
on public.menu_items
for select
to anon, authenticated
using (
  exists (
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

-- No SELECT policy is created for restaurant_admin_access. Only service_role /
-- trusted backend operations can read or mutate PIN access records.

insert into public.restaurants (slug, name, city, is_active)
values ('exort-demo', 'Exort Demo Restaurant', 'Almaty', true)
on conflict (slug) do update
set
  name = excluded.name,
  city = excluded.city,
  is_active = excluded.is_active;

insert into public.restaurant_admin_access (
  restaurant_id,
  pin_hash,
  is_active
)
select
  restaurant.id,
  'sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  true
from public.restaurants restaurant
where restaurant.slug = 'exort-demo'
on conflict (restaurant_id) do update
set
  pin_hash = excluded.pin_hash,
  is_active = excluded.is_active;

insert into public.menu_categories (
  restaurant_id,
  name_ru,
  name_kz,
  name_en,
  title_ru,
  title_kk,
  title_en,
  sort_order,
  is_active
)
select
  restaurant.id,
  category.name_ru,
  category.name_kz,
  category.name_en,
  category.name_ru,
  category.name_kz,
  category.name_en,
  category.sort_order,
  true
from public.restaurants restaurant
cross join (
  values
    ('Завтраки', 'Таңғы ас', 'Breakfasts', 10),
    ('Салаты', 'Салаттар', 'Salads', 20),
    ('Горячее', 'Ыстық тағамдар', 'Hot dishes', 30),
    ('Напитки', 'Сусындар', 'Drinks', 40)
) as category(name_ru, name_kz, name_en, sort_order)
where restaurant.slug = 'exort-demo'
on conflict (restaurant_id, name_ru) do update
set
  name_kz = excluded.name_kz,
  name_en = excluded.name_en,
  title_ru = excluded.title_ru,
  title_kk = excluded.title_kk,
  title_en = excluded.title_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.menu_items (
  restaurant_id,
  category_id,
  content_key,
  name_ru,
  name_kz,
  name_en,
  title_ru,
  title_kk,
  title_en,
  description_ru,
  description_kz,
  description_kk,
  description_en,
  price,
  currency,
  image_url,
  is_active,
  sort_order,
  version
)
select
  restaurant.id,
  category.id,
  item.content_key,
  item.name_ru,
  item.name_kz,
  item.name_en,
  item.name_ru,
  item.name_kz,
  item.name_en,
  item.description_ru,
  item.description_kz,
  item.description_kz,
  item.description_en,
  item.price,
  'KZT',
  null,
  true,
  item.sort_order,
  1
from public.restaurants restaurant
join (
  values
    ('Завтраки', 'syrniki', 'Сырники', 'Сырники', 'Syrniki', 'Сметана, ягоды и мёд.', 'Қаймақ, жидектер және бал.', 'Sour cream, berries and honey.', 2600, 10),
    ('Завтраки', 'english-breakfast', 'Английский завтрак', 'Ағылшын таңғы асы', 'English breakfast', 'Яйца, колбаски, фасоль, томаты и тост.', 'Жұмыртқа, шұжық, бұршақ, қызанақ және тост.', 'Eggs, sausages, beans, tomatoes and toast.', 3900, 20),
    ('Завтраки', 'avocado-toast', 'Тост с авокадо', 'Авокадо қосылған тост', 'Avocado toast', 'Авокадо, яйцо пашот и зелень.', 'Авокадо, пашот жұмыртқасы және көк.', 'Avocado, poached egg and greens.', 3200, 30),
    ('Салаты', 'chicken-caesar', 'Цезарь с курицей', 'Тауық еті қосылған Цезарь', 'Chicken Caesar', 'Курица, романо, пармезан и соус Цезарь.', 'Тауық еті, романо, пармезан және Цезарь соусы.', 'Chicken, romaine, parmesan and Caesar dressing.', 3200, 10),
    ('Салаты', 'fresh-vegetable-salad', 'Салат из свежих овощей', 'Балғын көкөністер салаты', 'Fresh vegetable salad', 'Томаты, огурцы, зелень и оливковое масло.', 'Қызанақ, қияр, көк және зәйтүн майы.', 'Tomatoes, cucumbers, greens and olive oil.', 2400, 20),
    ('Горячее', 'ribeye-steak', 'Стейк рибай', 'Рибай стейкі', 'Ribeye steak', 'Стейк рибай с овощами и фирменным соусом.', 'Көкөністер және фирмалық соус қосылған рибай.', 'Ribeye steak with vegetables and signature sauce.', 8900, 10),
    ('Горячее', 'chicken-pasta', 'Паста с курицей', 'Тауық еті қосылған паста', 'Chicken pasta', 'Паста, курица, сливочный соус и пармезан.', 'Паста, тауық еті, кілегейлі соус және пармезан.', 'Pasta, chicken, cream sauce and parmesan.', 4200, 20),
    ('Горячее', 'beef-burger', 'Бургер с говядиной', 'Сиыр еті қосылған бургер', 'Beef burger', 'Говяжья котлета, сыр, овощи и картофель фри.', 'Сиыр еті котлеті, ірімшік, көкөністер және фри.', 'Beef patty, cheese, vegetables and fries.', 4600, 30),
    ('Напитки', 'flat-white', 'Флэт уайт', 'Флэт уайт', 'Flat white', 'Эспрессо и молоко.', 'Эспрессо және сүт.', 'Espresso and milk.', 1400, 10),
    ('Напитки', 'homemade-lemonade', 'Домашний лимонад', 'Үй лимонады', 'Homemade lemonade', 'Цитрусы, мята и газированная вода.', 'Цитрус, жалбыз және газдалған су.', 'Citrus, mint and sparkling water.', 1800, 20),
    ('Напитки', 'berry-tea', 'Ягодный чай', 'Жидек шайы', 'Berry tea', 'Ягоды, чай и мёд.', 'Жидектер, шай және бал.', 'Berries, tea and honey.', 1900, 30)
) as item(
  category_ru,
  content_key,
  name_ru,
  name_kz,
  name_en,
  description_ru,
  description_kz,
  description_en,
  price,
  sort_order
)
  on true
join public.menu_categories category
  on category.restaurant_id = restaurant.id
 and category.name_ru = item.category_ru
where restaurant.slug = 'exort-demo'
on conflict (restaurant_id, content_key) do update
set
  category_id = excluded.category_id,
  name_ru = excluded.name_ru,
  name_kz = excluded.name_kz,
  name_en = excluded.name_en,
  title_ru = excluded.title_ru,
  title_kk = excluded.title_kk,
  title_en = excluded.title_en,
  description_ru = excluded.description_ru,
  description_kz = excluded.description_kz,
  description_kk = excluded.description_kk,
  description_en = excluded.description_en,
  price = excluded.price,
  currency = excluded.currency,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  version = public.menu_items.version + 1;

commit;

-- MVP PIN flow:
-- 1. frontend определяет restaurant по домену или slug страницы
-- 2. пользователь вводит только PIN
-- 3. backend проверяет pin_hash и возвращает временную admin session
-- 4. данные админки фильтруются по restaurant_id
