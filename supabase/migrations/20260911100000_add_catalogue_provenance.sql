alter table public.releases
  add constraint releases_external_provenance_complete check (
    (
      external_source is null
      and external_id is null
      and source_data is null
    )
    or (
      external_source = 'musicbrainz'
      and external_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and jsonb_typeof(source_data) = 'object'
      and source_data ->> 'provider' = external_source
      and octet_length(source_data::text) <= 32768
    )
  );

create function public.create_catalogue_collection_item(
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

  if not found then
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
  'Atomically and idempotently creates a private physical copy from server-verified catalogue metadata, reusing an existing owner-scoped release without overwriting user edits.';

create function public.create_catalogue_wishlist_item(
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

  if not found then
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
  'Atomically and idempotently creates a wishlist item from server-verified catalogue metadata, reusing an existing owner-scoped release without overwriting user edits.';

revoke all on function public.create_catalogue_collection_item(
  text, text, uuid, text, text, jsonb, text, public.release_format, smallint,
  smallint, smallint, text, text, text, text, boolean, text, text, text
) from public, anon;

revoke all on function public.create_catalogue_wishlist_item(
  text, text, uuid, text, text, jsonb, text, public.release_format, smallint,
  smallint, smallint, text, text, text, text, text, public.wishlist_priority,
  text, bigint, text, text, boolean
) from public, anon;

grant execute on function public.create_catalogue_collection_item(
  text, text, uuid, text, text, jsonb, text, public.release_format, smallint,
  smallint, smallint, text, text, text, text, boolean, text, text, text
) to authenticated;

grant execute on function public.create_catalogue_wishlist_item(
  text, text, uuid, text, text, jsonb, text, public.release_format, smallint,
  smallint, smallint, text, text, text, text, text, public.wishlist_priority,
  text, bigint, text, text, boolean
) to authenticated;

drop function public.search_collection_items(
  text,
  boolean,
  public.purchase_state,
  public.release_format,
  public.record_condition,
  text
);

create function public.search_collection_items(
  p_query text default null,
  p_favorite boolean default null,
  p_purchase_state public.purchase_state default null,
  p_format public.release_format default null,
  p_condition public.record_condition default null,
  p_sort text default 'newest'
)
returns table (
  id uuid,
  created_at timestamptz,
  acquired_on date,
  artist_display text,
  title text,
  cover_url text,
  format public.release_format,
  disc_count smallint,
  original_year smallint,
  release_year smallint,
  label text,
  catalog_number text,
  country text,
  is_favorite boolean,
  purchase_state public.purchase_state,
  media_condition public.record_condition,
  sleeve_condition public.record_condition,
  tags text[]
)
language sql
stable
set search_path = ''
as $function$
  select
    collection_items.id,
    collection_items.created_at,
    collection_items.acquired_on,
    releases.artist_display,
    releases.title,
    releases.cover_url,
    releases.format,
    releases.disc_count,
    releases.original_year,
    releases.release_year,
    releases.label,
    releases.catalog_number,
    releases.country,
    collection_items.is_favorite,
    collection_items.purchase_state,
    collection_items.media_condition,
    collection_items.sleeve_condition,
    coalesce(
      array_agg(tags.name order by tags.normalized_name)
        filter (where tags.id is not null),
      array[]::text[]
    ) as tags
  from public.collection_items
  join public.releases
    on releases.id = collection_items.release_id
    and releases.created_by = collection_items.user_id
  left join public.collection_item_tags
    on collection_item_tags.collection_item_id = collection_items.id
    and collection_item_tags.user_id = collection_items.user_id
  left join public.tags
    on tags.id = collection_item_tags.tag_id
    and tags.user_id = collection_item_tags.user_id
  where collection_items.user_id = (select auth.uid())
    and (
      nullif(btrim(p_query), '') is null
      or position(lower(btrim(p_query)) in lower(releases.artist_display)) > 0
      or position(lower(btrim(p_query)) in lower(releases.title)) > 0
      or position(lower(btrim(p_query)) in lower(coalesce(releases.label, ''))) > 0
      or position(lower(btrim(p_query)) in lower(coalesce(releases.catalog_number, ''))) > 0
      or position(lower(btrim(p_query)) in lower(coalesce(collection_items.notes, ''))) > 0
      or exists (
        select 1
        from public.collection_item_tags as matching_item_tags
        join public.tags as matching_tags
          on matching_tags.id = matching_item_tags.tag_id
          and matching_tags.user_id = matching_item_tags.user_id
        where matching_item_tags.collection_item_id = collection_items.id
          and matching_item_tags.user_id = collection_items.user_id
          and position(lower(btrim(p_query)) in matching_tags.normalized_name) > 0
      )
    )
    and (p_favorite is null or collection_items.is_favorite = p_favorite)
    and (p_purchase_state is null or collection_items.purchase_state = p_purchase_state)
    and (p_format is null or releases.format = p_format)
    and (
      p_condition is null
      or collection_items.media_condition = p_condition
      or collection_items.sleeve_condition = p_condition
    )
  group by collection_items.id, releases.id
  order by
    case when p_sort = 'acquired' then collection_items.acquired_on end desc nulls last,
    case when p_sort = 'artist' then lower(releases.artist_display) end,
    case when p_sort = 'title' then lower(releases.title) end,
    case
      when p_sort not in ('acquired', 'artist', 'title')
        then collection_items.created_at
    end desc,
    lower(releases.artist_display),
    lower(releases.title),
    collection_items.id;
$function$;

comment on function public.search_collection_items is
  'Returns an authenticated user''s filtered collection summary, including its safe remote cover reference. Search includes release identity, tags, and private notes without exposing rows across RLS boundaries.';

revoke all on function public.search_collection_items(
  text,
  boolean,
  public.purchase_state,
  public.release_format,
  public.record_condition,
  text
) from public, anon;

grant execute on function public.search_collection_items(
  text,
  boolean,
  public.purchase_state,
  public.release_format,
  public.record_condition,
  text
) to authenticated;
