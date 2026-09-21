begin;

alter table public.restaurants
  add column if not exists brand_line_1 text,
  add column if not exists brand_line_2 text,
  add column if not exists open_status_ru text,
  add column if not exists open_status_kk text,
  add column if not exists open_status_en text,
  add column if not exists open_status_tr text,
  add column if not exists whatsapp_url text,
  add column if not exists whatsapp_label text,
  add column if not exists wifi_name text,
  add column if not exists additional_info_ru text,
  add column if not exists additional_info_kk text,
  add column if not exists additional_info_en text,
  add column if not exists additional_info_tr text;

update public.restaurants
set
  open_status_ru = 'Открыто до 23:00',
  open_status_kk = '23:00-ге дейін ашық',
  open_status_en = 'Open until 23:00',
  open_status_tr = '23:00''e kadar açık',
  wifi_name = 'EXORT-DEMO · demo-only',
  updated_at = now()
where slug = 'exort-demo';

update public.restaurants
set
  logo_url = null,
  brand_line_1 = 'LEE',
  brand_line_2 = 'YOU',
  subtitle_ru = 'COFFEE · KOREAN CUISINE',
  subtitle_kk = 'COFFEE · KOREAN CUISINE',
  subtitle_en = 'COFFEE · KOREAN CUISINE',
  about_ru = 'Кофе и корейская кухня в одном месте.',
  about_kk = 'Кофе мен корей асханасы бір жерде.',
  about_en = 'Coffee and Korean cuisine in one place.',
  hours_ru = '08:00–21:00',
  hours_kk = '08:00–21:00',
  hours_en = '08:00–21:00',
  open_status_ru = 'Открыто · 08:00–21:00',
  open_status_kk = 'Ашық · 08:00–21:00',
  open_status_en = 'Open · 08:00–21:00',
  updated_at = now()
where slug = 'leeyou';

commit;
