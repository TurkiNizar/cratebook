begin;

select plan(14);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'art-a@example.test', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'art-b@example.test', now(), now());

insert into public.releases (
  id, created_by, artist_display, title, cover_url,
  external_source, external_entity_type, external_id, source_data
)
values (
  '11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Nina Simone',
  'Pastel Blues',
  'https://coverartarchive.org/release/33333333-3333-4333-8333-333333333333/front-500',
  'musicbrainz',
  'release',
  '33333333-3333-4333-8333-333333333333',
  '{"provider":"musicbrainz","entityType":"release","release":{"id":"33333333-3333-4333-8333-333333333333"}}'::jsonb
);

insert into public.collection_items (id, user_id, release_id)
values (
  '22222222-2222-4222-8222-222222222222',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
set local role authenticated;

select is(
  public.create_manual_collection_item(
    'Manual Artist',
    'Manual Album',
    '55555555-5555-4555-8555-555555555555'
  ) is not null,
  true,
  'the owner can create a coverless manual record for artwork editing'
);

select is(
  public.update_collection_item_details(
    p_item_id => (
      select id from public.collection_items
      where entry_key = '55555555-5555-4555-8555-555555555555'
    ),
    p_artist_display => 'Manual Artist',
    p_title => 'Manual Album',
    p_cover_url => 'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500',
    p_artwork_data => '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"44444444-4444-4444-8444-444444444444"},"coverArt":{"thumbnailUrl":"https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500","originalUrl":"https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front"}}'::jsonb,
    p_update_artwork => true
  )
  and (
    select external_source is null
      and external_entity_type is null
      and external_id is null
      and source_data is null
    from public.releases
    where id = (
      select release_id from public.collection_items
      where entry_key = '55555555-5555-4555-8555-555555555555'
    )
  ),
  true,
  'choosing representative artwork keeps a manual record manual'
);

select is(
  public.update_collection_item_details(
    p_item_id => '22222222-2222-4222-8222-222222222222',
    p_artist_display => 'Nina Simone',
    p_title => 'Pastel Blues',
    p_cover_url => 'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500',
    p_artwork_data => '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"44444444-4444-4444-8444-444444444444"},"coverArt":{"thumbnailUrl":"https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500","originalUrl":"https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front"}}'::jsonb,
    p_update_artwork => true
  ),
  true,
  'the owner can replace artwork atomically'
);

select is(
  (select cover_url from public.releases where id = '11111111-1111-4111-8111-111111111111'),
  'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500'::text,
  'replacement stores the selected cover'
);

select is(
  (select artwork_data #>> '{releaseGroup,id}' from public.releases where id = '11111111-1111-4111-8111-111111111111'),
  '44444444-4444-4444-8444-444444444444'::text,
  'replacement stores bounded independent artwork provenance'
);

select results_eq(
  $$
    select external_source, external_entity_type::text, external_id,
      source_data #>> '{release,id}'
    from public.releases
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  $$ values (
    'musicbrainz'::text, 'release'::text,
    '33333333-3333-4333-8333-333333333333'::text,
    '33333333-3333-4333-8333-333333333333'::text
  ) $$,
  'representative artwork does not change exact-release identity'
);

select lives_ok(
  $$
    select public.update_collection_item_details(
      p_item_id => '22222222-2222-4222-8222-222222222222',
      p_artist_display => 'Nina Simone',
      p_title => 'Pastel Blues — Kept',
      p_update_artwork => false
    )
  $$,
  'keeping artwork accepts unrelated metadata edits'
);

select is(
  (select cover_url from public.releases where id = '11111111-1111-4111-8111-111111111111'),
  'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500'::text,
  'keeping artwork leaves the selected cover unchanged'
);

select throws_like(
  $$
    select public.update_collection_item_details(
      p_item_id => '22222222-2222-4222-8222-222222222222',
      p_artist_display => 'Changed during failure',
      p_title => 'Pastel Blues — Kept',
      p_cover_url => 'https://example.com/unsafe.jpg',
      p_artwork_data => '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"44444444-4444-4444-8444-444444444444"},"coverArt":{"thumbnailUrl":"https://example.com/unsafe.jpg","originalUrl":"https://example.com/unsafe.jpg"}}'::jsonb,
      p_update_artwork => true
    )
  $$,
  '%releases_artwork_provenance_valid%',
  'unsafe artwork hosts are rejected at the database boundary'
);

select is(
  (select artist_display from public.releases where id = '11111111-1111-4111-8111-111111111111'),
  'Nina Simone'::text,
  'a failed artwork update rolls back unrelated metadata changes'
);

select throws_like(
  format(
    'select public.update_collection_item_details(p_item_id => %L, p_artist_display => %L, p_title => %L, p_cover_url => %L, p_artwork_data => %L::jsonb, p_update_artwork => true)',
    '22222222-2222-4222-8222-222222222222',
    'Nina Simone',
    'Pastel Blues — Kept',
    'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500',
    jsonb_build_object(
      'provider', 'musicbrainz',
      'entityType', 'release_group',
      'releaseGroup', jsonb_build_object('id', '44444444-4444-4444-8444-444444444444'),
      'coverArt', jsonb_build_object(
        'thumbnailUrl', 'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500',
        'originalUrl', 'https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/' || repeat('x', 8200)
      )
    )::text
  ),
  '%releases_artwork_provenance_valid%',
  'oversized artwork provenance is rejected'
);

select is(
  public.update_collection_item_details(
    p_item_id => '22222222-2222-4222-8222-222222222222',
    p_artist_display => 'Nina Simone',
    p_title => 'Pastel Blues — No cover',
    p_update_artwork => true
  ),
  true,
  'the owner can explicitly remove artwork'
);

select results_eq(
  $$ select cover_url, artwork_data from public.releases where id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (null::text, null::jsonb) $$,
  'removal clears only cover and independent artwork provenance'
);

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);

select is(
  public.update_collection_item_details(
    p_item_id => '22222222-2222-4222-8222-222222222222',
    p_artist_display => 'Other user',
    p_title => 'Other user',
    p_update_artwork => true
  ),
  false,
  'another user cannot remove or replace the artwork'
);

select * from finish();
rollback;
