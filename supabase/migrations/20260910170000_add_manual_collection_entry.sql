alter table public.releases
  add constraint releases_label_length check (
    label is null or char_length(label) <= 300
  ),
  add constraint releases_catalog_number_length check (
    catalog_number is null or char_length(catalog_number) <= 100
  ),
  add constraint releases_edition_description_length check (
    edition_description is null or char_length(edition_description) <= 1000
  ),
  add constraint releases_vinyl_color_length check (
    vinyl_color is null or char_length(vinyl_color) <= 100
  ),
  add constraint releases_barcode_length check (
    barcode is null or char_length(barcode) <= 100
  ),
  add constraint releases_matrix_runout_length check (
    matrix_runout is null or char_length(matrix_runout) <= 2000
  );

create function public.create_manual_collection_item(
  p_artist_display text,
  p_title text,
  p_entry_key uuid,
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

  insert into public.releases (
    created_by,
    artist_display,
    title,
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
    matrix_runout
  )
  values (
    v_user_id,
    btrim(p_artist_display),
    btrim(p_title),
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
    nullif(btrim(p_matrix_runout), '')
  )
  returning id into v_release_id;

  insert into public.collection_items (user_id, release_id, entry_key)
  values (v_user_id, v_release_id, p_entry_key)
  returning id into v_collection_item_id;

  return v_collection_item_id;
end;
$function$;

comment on function public.create_manual_collection_item is
  'Atomically creates user-scoped release metadata and one physical copy. Reusing an entry key returns the original copy without creating duplicates.';

revoke all on function public.create_manual_collection_item(
  text,
  text,
  uuid,
  public.release_format,
  smallint,
  smallint,
  smallint,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text
) from public, anon;

grant execute on function public.create_manual_collection_item(
  text,
  text,
  uuid,
  public.release_format,
  smallint,
  smallint,
  smallint,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text
) to authenticated;
