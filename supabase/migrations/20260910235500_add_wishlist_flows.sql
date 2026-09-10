alter table public.wishlist_items
  add column entry_key uuid not null default gen_random_uuid(),
  add constraint wishlist_items_entry_key_unique unique (user_id, entry_key);

comment on column public.wishlist_items.entry_key is
  'Client-supplied idempotency key used to prevent accidental duplicate submissions.';

create function public.create_manual_wishlist_item(
  p_artist_display text,
  p_title text,
  p_entry_key uuid,
  p_priority public.wishlist_priority default 'interested',
  p_preferred_edition text default null,
  p_max_price_minor bigint default null,
  p_price_currency text default null,
  p_notes text default null,
  p_is_public boolean default false
)
returns uuid
language plpgsql
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_release_id uuid;
  v_wishlist_item_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_entry_key::text, 0)
  );

  select id
  into v_wishlist_item_id
  from public.wishlist_items
  where user_id = v_user_id
    and entry_key = p_entry_key;

  if found then
    return v_wishlist_item_id;
  end if;

  insert into public.releases (created_by, artist_display, title)
  values (v_user_id, btrim(p_artist_display), btrim(p_title))
  returning id into v_release_id;

  insert into public.wishlist_items (
    user_id,
    release_id,
    entry_key,
    priority,
    preferred_edition,
    max_price_minor,
    price_currency,
    notes,
    is_public
  )
  values (
    v_user_id,
    v_release_id,
    p_entry_key,
    p_priority,
    nullif(btrim(p_preferred_edition), ''),
    p_max_price_minor,
    nullif(upper(btrim(p_price_currency)), ''),
    nullif(btrim(p_notes), ''),
    p_is_public
  )
  returning id into v_wishlist_item_id;

  return v_wishlist_item_id;
end;
$function$;

comment on function public.create_manual_wishlist_item is
  'Atomically and idempotently creates user-scoped release metadata and one wishlist item.';

create function public.update_wishlist_item_details(
  p_item_id uuid,
  p_artist_display text,
  p_title text,
  p_priority public.wishlist_priority,
  p_preferred_edition text default null,
  p_max_price_minor bigint default null,
  p_price_currency text default null,
  p_notes text default null,
  p_is_public boolean default false
)
returns boolean
language plpgsql
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_release_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.wishlist_items
  set
    priority = p_priority,
    preferred_edition = nullif(btrim(p_preferred_edition), ''),
    max_price_minor = p_max_price_minor,
    price_currency = nullif(upper(btrim(p_price_currency)), ''),
    notes = nullif(btrim(p_notes), ''),
    is_public = p_is_public
  where id = p_item_id
    and user_id = v_user_id
  returning release_id into v_release_id;

  if not found then
    return false;
  end if;

  update public.releases
  set
    artist_display = btrim(p_artist_display),
    title = btrim(p_title)
  where id = v_release_id
    and created_by = v_user_id;

  if not found then
    raise exception 'Owned release not found' using errcode = 'P0002';
  end if;

  return true;
end;
$function$;

comment on function public.update_wishlist_item_details is
  'Atomically updates an authenticated user''s wishlist preferences and release identity while preserving other release metadata.';

create function public.delete_wishlist_item(p_item_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_release_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.wishlist_items
  where id = p_item_id
    and user_id = v_user_id
  returning release_id into v_release_id;

  if not found then
    return false;
  end if;

  delete from public.releases
  where id = v_release_id
    and created_by = v_user_id
    and not exists (
      select 1
      from public.collection_items
      where release_id = v_release_id
        and user_id = v_user_id
    )
    and not exists (
      select 1
      from public.wishlist_items
      where release_id = v_release_id
        and user_id = v_user_id
    );

  return true;
end;
$function$;

comment on function public.delete_wishlist_item is
  'Deletes an owned wishlist item and removes its release only when no collection or wishlist item still references it.';

revoke all on function public.create_manual_wishlist_item(
  text,
  text,
  uuid,
  public.wishlist_priority,
  text,
  bigint,
  text,
  text,
  boolean
) from public, anon;

revoke all on function public.update_wishlist_item_details(
  uuid,
  text,
  text,
  public.wishlist_priority,
  text,
  bigint,
  text,
  text,
  boolean
) from public, anon;

revoke all on function public.delete_wishlist_item(uuid) from public, anon;

grant execute on function public.create_manual_wishlist_item(
  text,
  text,
  uuid,
  public.wishlist_priority,
  text,
  bigint,
  text,
  text,
  boolean
) to authenticated;

grant execute on function public.update_wishlist_item_details(
  uuid,
  text,
  text,
  public.wishlist_priority,
  text,
  bigint,
  text,
  text,
  boolean
) to authenticated;

grant execute on function public.delete_wishlist_item(uuid) to authenticated;
