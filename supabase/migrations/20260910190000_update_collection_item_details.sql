create function public.update_collection_item_details(
  p_item_id uuid,
  p_artist_display text,
  p_title text,
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
  p_matrix_runout text default null,
  p_purchase_state public.purchase_state default 'unknown',
  p_media_condition public.record_condition default null,
  p_sleeve_condition public.record_condition default null,
  p_acquired_on date default null,
  p_acquired_from text default null,
  p_price_paid_minor bigint default null,
  p_price_currency text default null,
  p_rating smallint default null,
  p_is_favorite boolean default false,
  p_notes text default null
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

  update public.collection_items
  set
    purchase_state = p_purchase_state,
    media_condition = p_media_condition,
    sleeve_condition = p_sleeve_condition,
    acquired_on = p_acquired_on,
    acquired_from = nullif(btrim(p_acquired_from), ''),
    price_paid_minor = p_price_paid_minor,
    price_currency = nullif(upper(btrim(p_price_currency)), ''),
    rating = p_rating,
    is_favorite = p_is_favorite,
    notes = nullif(btrim(p_notes), '')
  where id = p_item_id
    and user_id = v_user_id
  returning release_id into v_release_id;

  if not found then
    return false;
  end if;

  update public.releases
  set
    artist_display = btrim(p_artist_display),
    title = btrim(p_title),
    format = p_format,
    disc_count = p_disc_count,
    original_year = p_original_year,
    release_year = p_release_year,
    label = nullif(btrim(p_label), ''),
    catalog_number = nullif(btrim(p_catalog_number), ''),
    country = nullif(btrim(p_country), ''),
    edition_description = nullif(btrim(p_edition_description), ''),
    is_reissue = p_is_reissue,
    vinyl_color = nullif(btrim(p_vinyl_color), ''),
    barcode = nullif(btrim(p_barcode), ''),
    matrix_runout = nullif(btrim(p_matrix_runout), '')
  where id = v_release_id
    and created_by = v_user_id;

  if not found then
    raise exception 'Owned release not found' using errcode = 'P0002';
  end if;

  return true;
end;
$function$;

comment on function public.update_collection_item_details is
  'Atomically updates an authenticated user''s physical-copy details and its user-scoped release metadata.';

revoke all on function public.update_collection_item_details(
  uuid,
  text,
  text,
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
  text,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text
) from public, anon;

grant execute on function public.update_collection_item_details(
  uuid,
  text,
  text,
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
  text,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text
) to authenticated;
