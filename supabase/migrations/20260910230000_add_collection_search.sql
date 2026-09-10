create index releases_created_by_format_idx
  on public.releases (created_by, format)
  where format is not null;

create index collection_items_user_purchase_state_idx
  on public.collection_items (user_id, purchase_state);

create index collection_items_user_media_condition_idx
  on public.collection_items (user_id, media_condition)
  where media_condition is not null;

create index collection_items_user_sleeve_condition_idx
  on public.collection_items (user_id, sleeve_condition)
  where sleeve_condition is not null;

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
  'Returns an authenticated user''s filtered collection summary. Search includes release identity, tags, and private notes without exposing rows across RLS boundaries.';

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
