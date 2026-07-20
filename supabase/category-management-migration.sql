begin;

create or replace function public.admin_split_menu_category(
  p_restaurant_id uuid,
  p_category_id uuid,
  p_name_ru text,
  p_name_kz text,
  p_name_en text,
  p_item_ids uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source public.menu_categories%rowtype;
  v_new_category_id uuid;
  v_source_count integer;
  v_requested_count integer;
  v_selected_count integer;
begin
  if nullif(btrim(coalesce(p_name_ru, '')), '') is null
     or nullif(btrim(coalesce(p_name_kz, '')), '') is null
     or nullif(btrim(coalesce(p_name_en, '')), '') is null then
    raise exception 'All category translations are required.';
  end if;

  select * into v_source
  from public.menu_categories
  where id = p_category_id and restaurant_id = p_restaurant_id
  for update;

  if not found then
    raise exception 'Category was not found.';
  end if;

  select count(*) into v_source_count
  from public.menu_items
  where restaurant_id = p_restaurant_id and category_id = p_category_id;

  select count(distinct item_id) into v_requested_count
  from unnest(coalesce(p_item_ids, array[]::uuid[])) as requested(item_id);

  if v_requested_count = 0 then
    raise exception 'Select at least one dish.';
  end if;

  select count(*) into v_selected_count
  from public.menu_items
  where restaurant_id = p_restaurant_id
    and category_id = p_category_id
    and id = any(coalesce(p_item_ids, array[]::uuid[]));

  if v_selected_count <> v_requested_count then
    raise exception 'One or more dishes do not belong to this category.';
  end if;

  if v_selected_count >= v_source_count then
    raise exception 'The source category must keep at least one dish.';
  end if;

  with ranked as (
    select id, row_number() over (order by sort_order, created_at, id) as position
    from public.menu_categories
    where restaurant_id = p_restaurant_id
  )
  update public.menu_categories as category
  set sort_order = (ranked.position * 20)::integer
  from ranked
  where category.id = ranked.id;

  select * into v_source
  from public.menu_categories
  where id = p_category_id and restaurant_id = p_restaurant_id;

  insert into public.menu_categories (
    restaurant_id, name_ru, name_kz, name_en,
    title_ru, title_kk, title_en, sort_order, is_active
  ) values (
    p_restaurant_id, btrim(p_name_ru), btrim(p_name_kz), btrim(p_name_en),
    btrim(p_name_ru), btrim(p_name_kz), btrim(p_name_en), v_source.sort_order + 10, true
  ) returning id into v_new_category_id;

  update public.menu_items
  set category_id = v_new_category_id
  where restaurant_id = p_restaurant_id
    and category_id = p_category_id
    and id = any(p_item_ids);

  return jsonb_build_object(
    'category_id', v_new_category_id,
    'moved_items', v_selected_count
  );
end;
$$;

create or replace function public.admin_delete_menu_category(
  p_restaurant_id uuid,
  p_category_id uuid,
  p_mode text,
  p_target_category_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_category public.menu_categories%rowtype;
  v_item_count integer;
begin
  select * into v_category
  from public.menu_categories
  where id = p_category_id and restaurant_id = p_restaurant_id
  for update;

  if not found then
    raise exception 'Category was not found.';
  end if;

  select count(*) into v_item_count
  from public.menu_items
  where restaurant_id = p_restaurant_id and category_id = p_category_id;

  if v_item_count = 0 then
    if p_mode <> 'empty' then
      raise exception 'Empty category deletion requires empty mode.';
    end if;
  elsif p_mode = 'move' then
    if p_target_category_id is null or p_target_category_id = p_category_id then
      raise exception 'Select another target category.';
    end if;
    if not exists (
      select 1 from public.menu_categories
      where id = p_target_category_id and restaurant_id = p_restaurant_id
    ) then
      raise exception 'Target category was not found.';
    end if;
    update public.menu_items
    set category_id = p_target_category_id
    where restaurant_id = p_restaurant_id and category_id = p_category_id;
  elsif p_mode = 'cascade' then
    delete from public.menu_items
    where restaurant_id = p_restaurant_id and category_id = p_category_id;
  else
    raise exception 'Choose how to handle dishes before deleting the category.';
  end if;

  delete from public.menu_categories
  where id = p_category_id and restaurant_id = p_restaurant_id;

  with ranked as (
    select id, row_number() over (order by sort_order, created_at, id) as position
    from public.menu_categories
    where restaurant_id = p_restaurant_id
  )
  update public.menu_categories as category
  set sort_order = (ranked.position * 10)::integer
  from ranked
  where category.id = ranked.id;

  return jsonb_build_object(
    'affected_items', v_item_count,
    'mode', p_mode
  );
end;
$$;

revoke all on function public.admin_split_menu_category(uuid, uuid, text, text, text, uuid[]) from public, anon, authenticated;
revoke all on function public.admin_delete_menu_category(uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_split_menu_category(uuid, uuid, text, text, text, uuid[]) to service_role;
grant execute on function public.admin_delete_menu_category(uuid, uuid, text, uuid) to service_role;

commit;
