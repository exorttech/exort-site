begin;

-- Test tenant for the guest-menu data flow. The script is idempotent so it can
-- be safely re-applied to a restored database.
with restaurant as (
  insert into public.restaurants (slug, name, is_active)
  values ('leeyou', 'Leeyou', true)
  on conflict (slug) do update
    set name = excluded.name,
        is_active = excluded.is_active,
        updated_at = now()
  returning id
), category_input(title_ru, title_kk, title_en, sort_order) as (
  values
    ('Кофе', 'Кофе', 'Coffee', 10),
    ('Завтраки', 'Таңғы ас', 'Breakfast', 20),
    ('Десерты', 'Десерттер', 'Desserts', 30)
)
insert into public.menu_categories (
  restaurant_id, title_ru, title_kk, title_en, sort_order, is_active
)
select restaurant.id, category_input.title_ru, category_input.title_kk,
       category_input.title_en, category_input.sort_order, true
from restaurant
cross join category_input
where not exists (
  select 1
  from public.menu_categories category
  where category.restaurant_id = restaurant.id
    and category.title_ru = category_input.title_ru
);

with restaurant as (
  select id from public.restaurants where slug = 'leeyou'
), item_input(
  category_title_ru, content_key, title_ru, title_kk, title_en,
  description_ru, description_kk, description_en, price, weight, image_url, sort_order
) as (
  values
    ('Кофе', 'cappuccino', 'Капучино', 'Капучино', 'Cappuccino',
      'Двойной эспрессо и молоко с плотной молочной пеной.',
      'Қос эспрессо және қою сүт көбігі бар сүт.',
      'Double espresso with steamed milk and a dense milk foam.',
      5000, '250 мл', 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=84', 10),
    ('Кофе', 'latte', 'Латте', 'Латте', 'Latte',
      'Мягкий эспрессо с горячим молоком.',
      'Ыстық сүт қосылған жұмсақ эспрессо.',
      'Smooth espresso with steamed milk.',
      4500, '350 мл', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=900&q=84', 20),
    ('Кофе', 'americano', 'Американо', 'Американо', 'Americano',
      'Двойной эспрессо и горячая вода.',
      'Қос эспрессо және ыстық су.',
      'Double espresso and hot water.',
      3500, '300 мл', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=84', 30),
    ('Завтраки', 'avocado-toast', 'Тост с авокадо', 'Авокадо қосылған тост', 'Avocado toast',
      'Хлеб на закваске, авокадо, яйцо пашот и зелень.',
      'Ашытқылы нан, авокадо, пашот жұмыртқасы және көк.',
      'Sourdough, avocado, poached egg and herbs.',
      5900, '260 г', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=84', 10),
    ('Десерты', 'basque-cheesecake', 'Баскский чизкейк', 'Баск чизкейкі', 'Basque cheesecake',
      'Нежная кремовая середина и карамелизированная корочка.',
      'Жұмсақ кілегейлі ортасы және карамельденген қыртысы.',
      'Creamy centre with a caramelised top.',
      4200, '160 г', 'https://images.unsplash.com/photo-1578775887804-699de7086ff9?auto=format&fit=crop&w=900&q=84', 10)
)
insert into public.menu_items (
  restaurant_id, category_id, content_key,
  title_ru, title_kk, title_en,
  description_ru, description_kk, description_en,
  price, currency, weight, image_url, sort_order, is_active, is_stoplisted
)
select restaurant.id, category.id, item.content_key,
       item.title_ru, item.title_kk, item.title_en,
       item.description_ru, item.description_kk, item.description_en,
       item.price, '₸', item.weight, item.image_url, item.sort_order, true, false
from restaurant
join item_input item on true
join public.menu_categories category
  on category.restaurant_id = restaurant.id
 and category.title_ru = item.category_title_ru
on conflict (restaurant_id, content_key) do update
  set category_id = excluded.category_id,
      title_ru = excluded.title_ru,
      title_kk = excluded.title_kk,
      title_en = excluded.title_en,
      description_ru = excluded.description_ru,
      description_kk = excluded.description_kk,
      description_en = excluded.description_en,
      price = excluded.price,
      currency = excluded.currency,
      weight = excluded.weight,
      image_url = excluded.image_url,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active,
      is_stoplisted = excluded.is_stoplisted,
      updated_at = now();

commit;
