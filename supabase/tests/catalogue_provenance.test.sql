begin;

select plan(27);

select has_function(
  'public',
  'create_catalogue_collection_item',
  'catalogue collection creation function exists'
);
select has_function(
  'public',
  'create_catalogue_wishlist_item',
  'catalogue wishlist creation function exists'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('71717171-7171-4717-8717-717171717171', 'authenticated', 'authenticated', 'catalogue-a@example.test', now(), now()),
  ('72727272-7272-4727-8727-727272727272', 'authenticated', 'authenticated', 'catalogue-b@example.test', now(), now());

select set_config('request.jwt.claim.sub', '71717171-7171-4717-8717-717171717171', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_catalogue_collection_item(
    'Miles Davis',
    'Kind of Blue',
    '71717171-0000-4000-8000-000000000001',
    'musicbrainz',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz","entityType":"release","release":{"id":"11111111-1111-4111-8111-111111111111"},"coverArt":{"originalUrl":"https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front"}}'::jsonb,
    'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500',
    'lp',
    1::smallint,
    1959::smallint,
    1959::smallint,
    'Columbia',
    'CS 8163',
    'US',
    'Stereo edition',
    false,
    null,
    '012345678905'
  ) $$,
  'an authenticated user can create a catalogue collection item'
);

select results_eq(
  $$ select external_source, external_entity_type, external_id, cover_url from public.releases $$,
  $$ values (
    'musicbrainz'::text,
    'release'::public.catalogue_entity_type,
    '11111111-1111-4111-8111-111111111111'::text,
    'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500'::text
  ) $$,
  'the release stores its source identity and remote cover reference'
);
select is(
  (select source_data ->> 'entityType' from public.releases),
  'release'::text,
  'exact-release RPC writes retain explicit entity provenance'
);
select col_type_is(
  'public',
  'releases',
  'external_entity_type',
  'catalogue_entity_type',
  'catalogue entity type is represented explicitly in the schema'
);
select is(
  (select source_data ->> 'provider' from public.releases),
  'musicbrainz'::text,
  'the release stores bounded provider provenance'
);
select is(
  (select is_public from public.collection_items),
  false,
  'a catalogue collection item remains private by default'
);

select lives_ok(
  $$ select public.create_catalogue_wishlist_item(
    'Ignored artist edit',
    'Ignored title edit',
    '71717171-0000-4000-8000-000000000002',
    'musicbrainz',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz","entityType":"release","release":{"id":"11111111-1111-4111-8111-111111111111"}}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'wanted'
  ) $$,
  'the same catalogue release can be added to the wishlist'
);
select is(
  (select count(*) from public.releases),
  1::bigint,
  'collection and wishlist reuse one owner-scoped catalogue release'
);
select results_eq(
  $$ select artist_display, title, label from public.releases $$,
  $$ values ('Miles Davis'::text, 'Kind of Blue'::text, 'Columbia'::text) $$,
  'reuse does not silently overwrite existing release edits'
);
select is(
  (select release_id from public.collection_items),
  (select release_id from public.wishlist_items),
  'the collection and wishlist items reference the same release'
);
select is(
  public.create_catalogue_collection_item(
    'Ignored',
    'Ignored',
    '71717171-0000-4000-8000-000000000001',
    'musicbrainz',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz"}'::jsonb
  ),
  (select id from public.collection_items),
  'an entry-key retry returns the original collection item'
);
select is(
  (select count(*) from public.collection_items),
  1::bigint,
  'an idempotent retry does not add another physical copy'
);

reset role;
select set_config('request.jwt.claim.sub', '72727272-7272-4727-8727-727272727272', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_catalogue_collection_item(
    'Miles Davis',
    'Kind of Blue',
    '72727272-0000-4000-8000-000000000001',
    'musicbrainz',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz","entityType":"release","release":{"id":"11111111-1111-4111-8111-111111111111"}}'::jsonb
  ) $$,
  'another user can retain an owner-scoped copy of the same catalogue release'
);
select is(
  (select source_data #>> '{release,id}' from public.releases),
  '11111111-1111-4111-8111-111111111111'::text,
  'the RPC stores exact-release identity provenance'
);
select lives_ok(
  $$ select public.create_catalogue_collection_item(
    'Ignored artist edit',
    'Ignored title edit',
    '72727272-0000-4000-8000-000000000002',
    'musicbrainz',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz","entityType":"release","release":{"id":"11111111-1111-4111-8111-111111111111"},"coverArt":{"thumbnailUrl":"https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500","originalUrl":"https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front"}}'::jsonb,
    'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500'
  ) $$,
  'reusing a catalogue release can supply artwork that was previously unavailable'
);
select is(
  (select count(*) from public.collection_items),
  2::bigint,
  'artwork backfill still creates the requested additional physical copy'
);
select is(
  (select cover_url from public.releases),
  'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500'::text,
  'reuse backfills a missing remote cover reference'
);
select is(
  (select source_data #>> '{coverArt,thumbnailUrl}' from public.releases),
  'https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500'::text,
  'reuse backfills matching cover provenance'
);
select results_eq(
  $$ select artist_display, title from public.releases $$,
  $$ values ('Miles Davis'::text, 'Kind of Blue'::text) $$,
  'artwork backfill does not overwrite existing catalogue metadata'
);
reset role;
select is(
  (
    select count(*)
    from public.releases
    where created_by in (
      '71717171-7171-4717-8717-717171717171',
      '72727272-7272-4727-8727-727272727272'
    )
  ),
  2::bigint,
  'catalogue release reuse never crosses owner boundaries'
);

set local role anon;
select throws_like(
  $$ select public.create_catalogue_collection_item(
    'No',
    'Access',
    '73737373-0000-4000-8000-000000000001',
    'musicbrainz',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"musicbrainz"}'::jsonb
  ) $$,
  '%permission denied for function create_catalogue_collection_item%',
  'anonymous visitors cannot invoke catalogue collection creation'
);

reset role;
select set_config('request.jwt.claim.sub', '71717171-7171-4717-8717-717171717171', true);
set local role authenticated;

select throws_like(
  $$ select public.create_catalogue_collection_item(
    'Invalid',
    'Provider',
    '71717171-0000-4000-8000-000000000003',
    'unknown',
    '11111111-1111-4111-8111-111111111111',
    '{"provider":"unknown"}'::jsonb
  ) $$,
  '%violates check constraint "releases_external_provenance_complete"%',
  'unsupported provider provenance is rejected'
);
select throws_like(
  $$ select public.create_catalogue_collection_item(
    'Invalid',
    'Snapshot',
    '71717171-0000-4000-8000-000000000004',
    'musicbrainz',
    '22222222-2222-4222-8222-222222222222',
    '{"provider":"other"}'::jsonb
  ) $$,
  '%violates check constraint "releases_external_provenance_complete"%',
  'mismatched provider provenance is rejected'
);
select is(
  (
    select count(*)
    from public.releases
    where created_by = '71717171-7171-4717-8717-717171717171'
  ),
  1::bigint,
  'failed catalogue writes leave no orphan release'
);
select is(
  (
    select count(*)
    from public.search_collection_items()
    where cover_url is not null
  ),
  1::bigint,
  'collection search returns the stored safe cover reference'
);

select * from finish();
rollback;
