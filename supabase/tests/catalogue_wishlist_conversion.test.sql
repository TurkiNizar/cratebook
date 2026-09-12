begin;

select plan(15);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '76767676-7676-4767-8767-767676767676',
  'authenticated',
  'authenticated',
  'catalogue-conversion@example.test',
  now(),
  now()
);

insert into public.releases (
  id,
  created_by,
  artist_display,
  title,
  cover_url,
  original_year,
  external_source,
  external_entity_type,
  external_id,
  source_data
)
values
  (
    '76767676-aaaa-4aaa-8aaa-767676767676',
    '76767676-7676-4767-8767-767676767676',
    'Miles Davis',
    'Kind of Blue',
    'https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500',
    1959,
    'musicbrainz',
    'release_group',
    '22222222-2222-4222-8222-222222222222',
    '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"22222222-2222-4222-8222-222222222222"},"coverArt":{"thumbnailUrl":"https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500","originalUrl":"https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front"}}'::jsonb
  ),
  (
    '76767676-bbbb-4bbb-8bbb-767676767676',
    '76767676-7676-4767-8767-767676767676',
    'Miles Davis',
    'Kind of Blue',
    'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500',
    1959,
    'musicbrainz',
    'release',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz","entityType":"release","release":{"id":"11111111-1111-4111-8111-111111111111"},"coverArt":{"thumbnailUrl":"https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500","originalUrl":"https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front"}}'::jsonb
  );

insert into public.collection_items (id, user_id, release_id, entry_key)
values (
  '76767676-cccc-4ccc-8ccc-767676767676',
  '76767676-7676-4767-8767-767676767676',
  '76767676-aaaa-4aaa-8aaa-767676767676',
  '76767676-0000-4000-8000-000000000001'
);

insert into public.wishlist_items (id, user_id, release_id, entry_key)
values
  (
    '76767676-dddd-4ddd-8ddd-767676767676',
    '76767676-7676-4767-8767-767676767676',
    '76767676-aaaa-4aaa-8aaa-767676767676',
    '76767676-0000-4000-8000-000000000002'
  ),
  (
    '76767676-eeee-4eee-8eee-767676767676',
    '76767676-7676-4767-8767-767676767676',
    '76767676-bbbb-4bbb-8bbb-767676767676',
    '76767676-0000-4000-8000-000000000003'
  );

select set_config('request.jwt.claim.sub', '76767676-7676-4767-8767-767676767676', true);
set local role authenticated;

select is(
  (select copy_count from public.find_collection_duplicates('miles  davis', 'KIND OF BLUE')),
  1::bigint,
  'duplicate lookup warns before a catalogue wishlist conversion'
);

select lives_ok(
  $$ select public.convert_wishlist_item_to_collection(
    '76767676-dddd-4ddd-8ddd-767676767676',
    '76767676-0000-4000-8000-000000000004'
  ) $$,
  'an album-level wishlist item converts to a physical copy'
);
select lives_ok(
  $$ select public.convert_wishlist_item_to_collection(
    '76767676-eeee-4eee-8eee-767676767676',
    '76767676-0000-4000-8000-000000000005'
  ) $$,
  'an exact-release wishlist item converts to a physical copy'
);
select is(
  (select count(*) from public.wishlist_items),
  0::bigint,
  'both converted wishes are removed'
);
select is(
  (select count(*) from public.releases),
  2::bigint,
  'conversion neither duplicates nor merges catalogue release rows'
);
select is(
  (
    select count(*)
    from public.collection_items
    where release_id = '76767676-aaaa-4aaa-8aaa-767676767676'
  ),
  2::bigint,
  'album conversion reuses the existing album-level release'
);
select is(
  (
    select count(*)
    from public.collection_items
    where release_id = '76767676-bbbb-4bbb-8bbb-767676767676'
  ),
  1::bigint,
  'exact conversion reuses the existing exact-release row'
);
select results_eq(
  $$ select external_entity_type, external_id, cover_url, source_data #>> '{releaseGroup,id}'
     from public.releases
     where id = '76767676-aaaa-4aaa-8aaa-767676767676' $$,
  $$ values (
    'release_group'::public.catalogue_entity_type,
    '22222222-2222-4222-8222-222222222222'::text,
    'https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500'::text,
    '22222222-2222-4222-8222-222222222222'::text
  ) $$,
  'album conversion preserves identity, representative cover, and provenance'
);
select is(
  (
    select source_data #>> '{coverArt,originalUrl}'
    from public.releases
    where id = '76767676-aaaa-4aaa-8aaa-767676767676'
  ),
  'https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front'::text,
  'album conversion preserves original artwork provenance'
);
select results_eq(
  $$ select external_entity_type, external_id, cover_url, source_data #>> '{release,id}'
     from public.releases
     where id = '76767676-bbbb-4bbb-8bbb-767676767676' $$,
  $$ values (
    'release'::public.catalogue_entity_type,
    '11111111-1111-4111-8111-111111111111'::text,
    'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500'::text,
    '11111111-1111-4111-8111-111111111111'::text
  ) $$,
  'exact conversion preserves identity, cover, and provenance'
);
select is(
  (
    select source_data #>> '{coverArt,originalUrl}'
    from public.releases
    where id = '76767676-bbbb-4bbb-8bbb-767676767676'
  ),
  'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front'::text,
  'exact conversion preserves original artwork provenance'
);
select is(
  (
    select count(*)
    from public.collection_items
    where entry_key in (
      '76767676-0000-4000-8000-000000000004',
      '76767676-0000-4000-8000-000000000005'
    )
      and is_public = false
  ),
  2::bigint,
  'converted catalogue copies remain private'
);
select is(
  (select original_year from public.releases where external_entity_type = 'release_group'),
  1959::smallint,
  'album conversion preserves known original year'
);
select is(
  (select format from public.releases where external_entity_type = 'release_group'),
  null::public.release_format,
  'album conversion does not invent pressing format'
);
select is(
  (select count(*) from public.find_collection_duplicates('Miles Davis', 'Kind of Blue')),
  1::bigint,
  'duplicate lookup remains advisory after both provenance types convert'
);

select * from finish();
rollback;
