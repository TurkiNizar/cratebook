create function public.convert_wishlist_item_to_collection(
  p_wishlist_item_id uuid,
  p_entry_key uuid,
  p_purchase_state public.purchase_state default 'unknown',
  p_media_condition public.record_condition default null,
  p_sleeve_condition public.record_condition default null,
  p_acquired_on date default null,
  p_acquired_from text default null,
  p_price_paid_minor bigint default null,
  p_price_currency text default null,
  p_rating smallint default null,
  p_is_favorite boolean default false,
  p_notes text default null,
  p_tags text[] default array[]::text[]
)
returns uuid
language plpgsql
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_release_id uuid;
  v_collection_item_id uuid;
  v_tag_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_wishlist_item_id::text, 0)
  );

  select id
  into v_collection_item_id
  from public.collection_items
  where user_id = v_user_id
    and entry_key = p_entry_key;

  if found then
    return v_collection_item_id;
  end if;

  select release_id
  into v_release_id
  from public.wishlist_items
  where id = p_wishlist_item_id
    and user_id = v_user_id
  for update;

  if not found then
    return null;
  end if;

  select count(
    distinct lower(btrim(regexp_replace(tag_name, '\s+', ' ', 'g')))
  )
  into v_tag_count
  from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag_name)
  where btrim(tag_name) <> '';

  if v_tag_count > 20 then
    raise exception 'A collection item can have at most 20 tags'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag_name)
    where char_length(btrim(regexp_replace(tag_name, '\s+', ' ', 'g'))) > 50
  ) then
    raise exception 'Tags must be 50 characters or fewer'
      using errcode = '22023';
  end if;

  insert into public.collection_items (
    user_id,
    release_id,
    entry_key,
    purchase_state,
    media_condition,
    sleeve_condition,
    acquired_on,
    acquired_from,
    price_paid_minor,
    price_currency,
    rating,
    is_favorite,
    notes,
    is_public
  )
  values (
    v_user_id,
    v_release_id,
    p_entry_key,
    p_purchase_state,
    p_media_condition,
    p_sleeve_condition,
    p_acquired_on,
    nullif(btrim(p_acquired_from), ''),
    p_price_paid_minor,
    nullif(upper(btrim(p_price_currency)), ''),
    p_rating,
    p_is_favorite,
    nullif(btrim(p_notes), ''),
    false
  )
  returning id into v_collection_item_id;

  insert into public.tags (user_id, name)
  select v_user_id, clean_name
  from (
    select distinct on (lower(clean_name)) clean_name
    from (
      select
        btrim(regexp_replace(tag_name, '\s+', ' ', 'g')) as clean_name,
        position
      from unnest(coalesce(p_tags, array[]::text[]))
        with ordinality as supplied(tag_name, position)
    ) as cleaned
    where clean_name <> ''
    order by lower(clean_name), position
  ) as unique_tags
  on conflict (user_id, normalized_name) do nothing;

  insert into public.collection_item_tags (collection_item_id, tag_id, user_id)
  select v_collection_item_id, tags.id, v_user_id
  from public.tags
  where tags.user_id = v_user_id
    and tags.normalized_name in (
      select distinct lower(btrim(regexp_replace(tag_name, '\s+', ' ', 'g')))
      from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag_name)
      where btrim(tag_name) <> ''
    );

  delete from public.wishlist_items
  where id = p_wishlist_item_id
    and user_id = v_user_id;

  return v_collection_item_id;
end;
$function$;

comment on function public.convert_wishlist_item_to_collection is
  'Atomically and idempotently turns an owned wishlist item into a private physical copy while reusing its release metadata.';

revoke all on function public.convert_wishlist_item_to_collection(
  uuid,
  uuid,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text,
  text[]
) from public, anon;

grant execute on function public.convert_wishlist_item_to_collection(
  uuid,
  uuid,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text,
  text[]
) to authenticated;
