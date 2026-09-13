create function public.get_public_profile(p_username text)
returns table (
  username text,
  display_name text,
  bio text,
  is_public boolean,
  is_owner boolean,
  collection_count bigint,
  wishlist_count bigint
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    profiles.username,
    profiles.display_name,
    profiles.bio,
    profiles.is_public,
    coalesce(profiles.id = auth.uid(), false) as is_owner,
    (
      select count(*)
      from public.collection_items
      where collection_items.user_id = profiles.id
        and collection_items.is_public
    ) as collection_count,
    (
      select count(*)
      from public.wishlist_items
      where wishlist_items.user_id = profiles.id
        and wishlist_items.is_public
    ) as wishlist_count
  from public.profiles
  where profiles.username = lower(btrim(p_username))
    and (profiles.is_public or profiles.id = auth.uid());
$function$;

comment on function public.get_public_profile(text) is
  'Returns only public-safe profile fields and visible-item counts for a public username, or an owner-only preview of a private profile.';

create function public.get_public_collection_items(p_username text)
returns table (
  id uuid,
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
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    collection_items.id,
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
    collection_items.created_at
  from public.profiles
  join public.collection_items
    on collection_items.user_id = profiles.id
  join public.releases
    on releases.id = collection_items.release_id
    and releases.created_by = profiles.id
  where profiles.username = lower(btrim(p_username))
    and (profiles.is_public or profiles.id = auth.uid())
    and collection_items.is_public
  order by collection_items.created_at desc, collection_items.id;
$function$;

comment on function public.get_public_collection_items(text) is
  'Returns a narrow release-and-favorite projection for visible copies on a public profile or its owner-only preview. Purchase, condition, acquisition, notes, tags, and provenance are excluded.';

create function public.get_public_wishlist_items(p_username text)
returns table (
  id uuid,
  artist_display text,
  title text,
  cover_url text,
  priority public.wishlist_priority,
  preferred_edition text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    wishlist_items.id,
    releases.artist_display,
    releases.title,
    releases.cover_url,
    wishlist_items.priority,
    wishlist_items.preferred_edition,
    wishlist_items.created_at
  from public.profiles
  join public.wishlist_items
    on wishlist_items.user_id = profiles.id
  join public.releases
    on releases.id = wishlist_items.release_id
    and releases.created_by = profiles.id
  where profiles.username = lower(btrim(p_username))
    and (profiles.is_public or profiles.id = auth.uid())
    and wishlist_items.is_public
  order by wishlist_items.created_at desc, wishlist_items.id;
$function$;

comment on function public.get_public_wishlist_items(text) is
  'Returns a narrow release-and-preference projection for visible wishes on a public profile or its owner-only preview. Target prices, notes, and provenance are excluded.';

revoke all on function public.get_public_profile(text) from public;
revoke all on function public.get_public_collection_items(text) from public;
revoke all on function public.get_public_wishlist_items(text) from public;

grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.get_public_collection_items(text) to anon, authenticated;
grant execute on function public.get_public_wishlist_items(text) to anon, authenticated;
