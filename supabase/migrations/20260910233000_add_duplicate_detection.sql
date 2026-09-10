create index releases_created_by_normalized_identity_idx
  on public.releases (
    created_by,
    lower(regexp_replace(btrim(artist_display), '\s+', ' ', 'g')),
    lower(regexp_replace(btrim(title), '\s+', ' ', 'g'))
  );

create function public.find_collection_duplicates(
  p_artist_display text,
  p_title text
)
returns table (
  collection_item_id uuid,
  artist_display text,
  title text,
  created_at timestamptz,
  copy_count bigint
)
language sql
stable
set search_path = ''
as $function$
  select
    collection_items.id,
    releases.artist_display,
    releases.title,
    collection_items.created_at,
    count(*) over() as copy_count
  from public.collection_items
  join public.releases
    on releases.id = collection_items.release_id
    and releases.created_by = collection_items.user_id
  where collection_items.user_id = (select auth.uid())
    and lower(regexp_replace(btrim(releases.artist_display), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(p_artist_display), '\s+', ' ', 'g'))
    and lower(regexp_replace(btrim(releases.title), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(p_title), '\s+', ' ', 'g'))
  order by collection_items.created_at desc, collection_items.id
  limit 1;
$function$;

comment on function public.find_collection_duplicates is
  'Returns possible duplicate physical copies for the authenticated user using normalized artist and title equality. Results are advisory and never block another copy.';

revoke all on function public.find_collection_duplicates(text, text)
  from public, anon;

grant execute on function public.find_collection_duplicates(text, text)
  to authenticated;
