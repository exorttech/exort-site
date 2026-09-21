begin;

alter table public.restaurants
  add column if not exists logo_url text,
  add column if not exists accent_color text,
  add column if not exists subtitle_ru text,
  add column if not exists subtitle_kk text,
  add column if not exists subtitle_en text,
  add column if not exists subtitle_tr text,
  add column if not exists about_ru text,
  add column if not exists about_kk text,
  add column if not exists about_en text,
  add column if not exists about_tr text,
  add column if not exists address_ru text,
  add column if not exists address_kk text,
  add column if not exists address_en text,
  add column if not exists address_tr text,
  add column if not exists address_url text,
  add column if not exists hours_ru text,
  add column if not exists hours_kk text,
  add column if not exists hours_en text,
  add column if not exists hours_tr text,
  add column if not exists phone text,
  add column if not exists instagram_url text,
  add column if not exists instagram_handle text,
  add column if not exists service_fee_percent numeric(5, 2),
  add column if not exists supported_languages text[] not null default array['ru', 'kk', 'en']::text[],
  add column if not exists is_demo boolean not null default false;

update public.restaurants
set
  hero_image_url = '/assets/demo-menu/hero.webp',
  accent_color = '#ff5a36',
  subtitle_ru = 'ALL-DAY KITCHEN · COFFEE · CITY BAR',
  subtitle_kk = 'ALL-DAY KITCHEN · COFFEE · CITY BAR',
  subtitle_en = 'ALL-DAY KITCHEN · COFFEE · CITY BAR',
  subtitle_tr = 'ALL-DAY KITCHEN · COFFEE · CITY BAR',
  about_ru = 'Вымышленное all-day заведение с открытой кухней, спешелти-кофе и небольшим вечерним баром.',
  about_kk = 'Ашық ас үйі, спешелти кофесі және шағын кешкі бары бар ойдан шығарылған all-day орын.',
  about_en = 'A fictional all-day venue with an open kitchen, specialty coffee and a small evening bar.',
  about_tr = 'Açık mutfak, nitelikli kahve ve küçük bir akşam barına sahip kurgusal all-day mekân.',
  address_ru = 'Демо-город, квартал Северный Свет, дом 00',
  address_kk = 'Демо-қала, Солтүстік Жарық орамы, 00 үй',
  address_en = 'Demo City, Northern Light quarter, building 00',
  address_tr = 'Demo Şehir, Kuzey Işığı mahallesi, bina 00',
  hours_ru = 'Ежедневно · 08:00–23:00',
  hours_kk = 'Күн сайын · 08:00–23:00',
  hours_en = 'Daily · 08:00–23:00',
  hours_tr = 'Her gün · 08:00–23:00',
  phone = '+7 000 000 00 00 · demo',
  instagram_handle = '@exort.demo.menu',
  service_fee_percent = 10,
  supported_languages = array['ru', 'kk', 'en', 'tr']::text[],
  is_demo = true,
  updated_at = now()
where slug = 'exort-demo';

update public.restaurants
set
  name = 'Lee You',
  city = 'Алматы',
  hero_image_url = '/assets/lee-you-hero.jpeg',
  logo_url = '/assets/lee-you-logo.jpg',
  subtitle_ru = 'Кофейня · Корейская кухня',
  subtitle_kk = 'Кофехана · Корей асханасы',
  subtitle_en = 'Coffee shop · Korean cuisine',
  about_ru = 'Кофейня с корейской кухней.',
  about_kk = 'Корей асханасы бар кофехана.',
  about_en = 'A coffee shop with Korean cuisine.',
  address_ru = 'Улица Егизбаева, 3 к7',
  address_kk = 'Улица Егизбаева, 3 к7',
  address_en = 'Улица Егизбаева, 3 к7',
  address_url = 'https://2gis.kz/almaty/geo/70030076332320195',
  instagram_url = 'https://www.instagram.com/leeyou.kz',
  instagram_handle = '@leeyou.kz',
  service_fee_percent = null,
  supported_languages = array['ru', 'kk', 'en']::text[],
  is_demo = false,
  updated_at = now()
where slug = 'leeyou';

commit;
