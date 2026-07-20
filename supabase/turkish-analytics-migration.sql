begin;

alter table public.menu_analytics_events
  drop constraint if exists menu_analytics_events_language_check;

alter table public.menu_analytics_events
  add constraint menu_analytics_events_language_check
  check (language is null or language in ('ru', 'kk', 'kz', 'en', 'tr'));

commit;
