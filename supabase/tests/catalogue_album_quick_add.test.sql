begin;

select plan(13);

select has_function(
  'public',
  'create_catalogue_collection_item',
  'entity-scoped catalogue collection creation exists'
);
select has_function(
  'public',
  'create_catalogue_wishlist_item',
  'entity-scoped catalogue wishlist creation exists'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '75757575-7575-4757-8757-757575757575',
  'authenticated',
  'authenticated',
  'album-quick-add@example.test',
  now(),
  now()
);

select set_config('request.jwt.claim.sub', '75757575-7575-4757-8757-757575757575', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_catalogue_collection_item(
    p_artist_display => 'Miles Davis',
    p_title => 'Kind of Blue',
    p_entry_key => '75757575-0000-4000-8000-000000000001',
    p_external_source => 'musicbrainz',
    p_external_id => '22222222-2222-4222-8222-222222222222',
    p_source_data => '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"22222222-2222-4222-8222-222222222222"},"coverArt":{"thumbnailUrl":"https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500","originalUrl":"https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front"}}'::jsonb,
    p_cover_url => 'https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500',
    p_original_year => 1959::smallint
  ) $$,
  'an album can be quick-added to the collection'
);

select results_eq(
  $$ select external_entity_type, cover_url, original_year, format, release_year
     from public.releases
     where external_entity_type = 'release_group' $$,
  $$ values (
    'release_group'::public.catalogue_entity_type,
    'https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500'::text,
    1959::smallint,
    null::public.release_format,
    null::smallint
  ) $$,
  'quick add stores album identity, representative artwork, and known year only'
);
select is(
  (
    select source_data #>> '{releaseGroup,id}'
    from public.releases
    where external_entity_type = 'release_group'
  ),
  '22222222-2222-4222-8222-222222222222'::text,
  'album provenance retains the release-group identifier'
);
select is(
  (select is_public from public.collection_items),
  false,
  'an album quick-added to the collection remains private'
);

select lives_ok(
  $$ select public.create_catalogue_wishlist_item(
    p_artist_display => 'Ignored edit',
    p_title => 'Ignored edit',
    p_entry_key => '75757575-0000-4000-8000-000000000002',
    p_external_source => 'musicbrainz',
    p_external_id => '22222222-2222-4222-8222-222222222222',
    p_source_data => '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"22222222-2222-4222-8222-222222222222"}}'::jsonb,
    p_priority => 'wanted'
  ) $$,
  'the same album can be quick-added to the wishlist'
);
select is(
  (select count(*) from public.releases),
  1::bigint,
  'collection and wishlist quick add reuse one album-level release'
);
select is(
  (select release_id from public.collection_items),
  (select release_id from public.wishlist_items),
  'both quick-add destinations reference the same album-level release'
);
select is(
  (select is_public from public.wishlist_items),
  false,
  'an album quick-added to the wishlist remains private'
);

select lives_ok(
  $$ select public.create_catalogue_collection_item(
    p_artist_display => 'Miles Davis',
    p_title => 'Kind of Blue exact edition',
    p_entry_key => '75757575-0000-4000-8000-000000000003',
    p_external_source => 'musicbrainz',
    p_external_id => '22222222-2222-4222-8222-222222222222',
    p_source_data => '{"provider":"musicbrainz","entityType":"release","release":{"id":"22222222-2222-4222-8222-222222222222"}}'::jsonb
  ) $$,
  'an exact release with the same UUID remains a distinct identity'
);
select is(
  (select count(*) from public.releases),
  2::bigint,
  'entity-scoped reuse does not conflate album and exact-release namespaces'
);

reset role;
set local role anon;
select throws_like(
  $$ select public.create_catalogue_collection_item(
    p_artist_display => 'No',
    p_title => 'Access',
    p_entry_key => '75757575-0000-4000-8000-000000000004',
    p_external_source => 'musicbrainz',
    p_external_id => '33333333-3333-4333-8333-333333333333',
    p_source_data => '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"33333333-3333-4333-8333-333333333333"}}'::jsonb
  ) $$,
  '%permission denied for function create_catalogue_collection_item%',
  'anonymous visitors cannot invoke album quick add'
);

select * from finish();
rollback;
