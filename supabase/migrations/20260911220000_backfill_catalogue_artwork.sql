create or replace function public.create_catalogue_collection_item(
  p_artist_display text,
  p_title text,
  p_entry_key uuid,
  p_external_source text,
  p_external_id text,
  p_source_data jsonb,
  p_cover_url text default null,
  p_format public.release_format default null,
  p_disc_count smallint default null,
  p_original_year smallint default null,
  p_release_year smallint default null,
  p_label text default null,
  p_catalog_number text default null,
  p_country text default null,
  p_edition_description text default null,
  p_is_reissue boolean default false,
  p_vinyl_color text default null,
  p_barcode text default null,
  p_matrix_runout text default null
)
returns uuid
language plpgsql
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_release_id uuid;
  v_collection_item_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_entry_key::text, 0)
  );

  select id
  into v_collection_item_id
  from public.collection_items
  where user_id = v_user_id
    and entry_key = p_entry_key;

  if found then
    return v_collection_item_id;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text || ':' || p_external_source || ':' || p_external_id,
      0
    )
  );

  select id
  into v_release_id
  from public.releases
  where created_by = v_user_id
    and external_source = p_external_source
    and external_id = p_external_id;

  if found then
    update public.releases
    set
      cover_url = nullif(btrim(p_cover_url), ''),
      source_data = case
        when p_source_data ? 'coverArt'
          then jsonb_set(source_data, '{coverArt}', p_source_data -> 'coverArt', true)
        else source_data
      end
    where id = v_release_id
      and cover_url is null
      and nullif(btrim(p_cover_url), '') is not null;
  else
    insert into public.releases (
      created_by,
      artist_display,
      title,
      cover_url,
      format,
      disc_count,
      original_year,
      release_year,
      label,
      catalog_number,
      country,
      edition_description,
      is_reissue,
      vinyl_color,
      barcode,
      matrix_runout,
      external_source,
      external_id,
      source_data
    )
    values (
      v_user_id,
      btrim(p_artist_display),
      btrim(p_title),
      nullif(btrim(p_cover_url), ''),
      p_format,
      p_disc_count,
      p_original_year,
      p_release_year,
      nullif(btrim(p_label), ''),
      nullif(btrim(p_catalog_number), ''),
      nullif(btrim(p_country), ''),
      nullif(btrim(p_edition_description), ''),
      p_is_reissue,
      nullif(btrim(p_vinyl_color), ''),
      nullif(btrim(p_barcode), ''),
      nullif(btrim(p_matrix_runout), ''),
      p_external_source,
      p_external_id,
      p_source_data
    )
    returning id into v_release_id;
  end if;

  insert into public.collection_items (user_id, release_id, entry_key)
  values (v_user_id, v_release_id, p_entry_key)
  returning id into v_collection_item_id;

  return v_collection_item_id;
end;
$function$;

comment on function public.create_catalogue_collection_item is
  'Atomically creates a private copy from verified catalogue metadata, reusing an owner-scoped release and backfilling only missing artwork.';

create or replace function public.create_catalogue_wishlist_item(
  p_artist_display text,
  p_title text,
  p_entry_key uuid,
  p_external_source text,
  p_external_id text,
  p_source_data jsonb,
  p_cover_url text default null,
  p_format public.release_format default null,
  p_disc_count smallint default null,
  p_original_year smallint default null,
  p_release_year smallint default null,
  p_label text default null,
  p_catalog_number text default null,
  p_country text default null,
  p_edition_description text default null,
  p_barcode text default null,
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

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text || ':' || p_external_source || ':' || p_external_id,
      0
    )
  );

  select id
  into v_release_id
  from public.releases
  where created_by = v_user_id
    and external_source = p_external_source
    and external_id = p_external_id;

  if found then
    update public.releases
    set
      cover_url = nullif(btrim(p_cover_url), ''),
      source_data = case
        when p_source_data ? 'coverArt'
          then jsonb_set(source_data, '{coverArt}', p_source_data -> 'coverArt', true)
        else source_data
      end
    where id = v_release_id
      and cover_url is null
      and nullif(btrim(p_cover_url), '') is not null;
  else
    insert into public.releases (
      created_by,
      artist_display,
      title,
      cover_url,
      format,
      disc_count,
      original_year,
      release_year,
      label,
      catalog_number,
      country,
      edition_description,
      barcode,
      external_source,
      external_id,
      source_data
    )
    values (
      v_user_id,
      btrim(p_artist_display),
      btrim(p_title),
      nullif(btrim(p_cover_url), ''),
      p_format,
      p_disc_count,
      p_original_year,
      p_release_year,
      nullif(btrim(p_label), ''),
      nullif(btrim(p_catalog_number), ''),
      nullif(btrim(p_country), ''),
      nullif(btrim(p_edition_description), ''),
      nullif(btrim(p_barcode), ''),
      p_external_source,
      p_external_id,
      p_source_data
    )
    returning id into v_release_id;
  end if;

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

comment on function public.create_catalogue_wishlist_item is
  'Atomically creates a wishlist item from verified catalogue metadata, reusing an owner-scoped release and backfilling only missing artwork.';
