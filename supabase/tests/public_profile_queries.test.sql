begin;

select plan(20);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('19191919-1919-4919-8919-191919191919', 'authenticated', 'authenticated', 'public-owner@example.test', now(), now()),
  ('29292929-2929-4929-8929-292929292929', 'authenticated', 'authenticated', 'private-owner@example.test', now(), now());

update public.profiles
set
  username = case id
    when '19191919-1919-4919-8919-191919191919' then 'public_listener'
    else 'private_listener'
  end,
  display_name = case id
    when '19191919-1919-4919-8919-191919191919' then 'Public Listener'
    else 'Private Listener'
  end,
  bio = 'Records with a story.',
  is_public = id = '19191919-1919-4919-8919-191919191919'
where id in (
  '19191919-1919-4919-8919-191919191919',
  '29292929-2929-4929-8929-292929292929'
);

insert into public.releases (
  id, created_by, artist_display, title, cover_url, format, original_year,
  external_source, external_id, source_data
)
values
  (
    '19191919-aaaa-4919-8919-191919191919',
    '19191919-1919-4919-8919-191919191919',
    'Visible Artist',
    'Visible Album',
    'https://coverartarchive.org/release-group/19191919-aaaa-4919-8919-191919191919/front-500',
    'lp',
    1971,
    'musicbrainz',
    '19191919-aaaa-4919-8919-191919191919',
    '{"private_provenance":"must not leak"}'::jsonb
  ),
  (
    '19191919-bbbb-4919-8919-191919191919',
    '19191919-1919-4919-8919-191919191919',
    'Hidden Artist',
    'Hidden Album',
    null,
    null,
    null,
    null,
    null,
    null
  ),
  (
    '29292929-aaaa-4929-8929-292929292929',
    '29292929-2929-4929-8929-292929292929',
    'Private Artist',
    'Private Album',
    null,
    null,
    null,
    null,
    null,
    null
  );

insert into public.collection_items (
  id, user_id, release_id, entry_key, acquired_from, price_paid_minor,
  price_currency, notes, is_favorite, is_public
)
values
  (
    '19191919-1111-4919-8919-191919191919',
    '19191919-1919-4919-8919-191919191919',
    '19191919-aaaa-4919-8919-191919191919',
    '19191919-0000-4919-8919-191919191919',
    'Secret shop', 4200, 'EUR', 'Private collection note', true, true
  ),
  (
    '19191919-2222-4919-8919-191919191919',
    '19191919-1919-4919-8919-191919191919',
    '19191919-bbbb-4919-8919-191919191919',
    '19191919-0000-4919-8919-292929292929',
    null, null, null, null, false, false
  ),
  (
    '29292929-1111-4929-8929-292929292929',
    '29292929-2929-4929-8929-292929292929',
    '29292929-aaaa-4929-8929-292929292929',
    '29292929-0000-4929-8929-292929292929',
    null, null, null, null, true, true
  );

insert into public.wishlist_items (
  id, user_id, release_id, priority, preferred_edition, max_price_minor,
  price_currency, notes, is_public
)
values
  (
    '19191919-3333-4919-8919-191919191919',
    '19191919-1919-4919-8919-191919191919',
    '19191919-aaaa-4919-8919-191919191919',
    'must_have', 'Any clean pressing', 9000, 'EUR', 'Private wishlist note', true
  ),
  (
    '19191919-4444-4919-8919-191919191919',
    '19191919-1919-4919-8919-191919191919',
    '19191919-bbbb-4919-8919-191919191919',
    'wanted', null, null, null, null, false
  ),
  (
    '29292929-3333-4929-8929-292929292929',
    '29292929-2929-4929-8929-292929292929',
    '29292929-aaaa-4929-8929-292929292929',
    'wanted', 'Visible only in owner preview', 5000, 'EUR',
    'Private preview note', true
  );

set local role anon;

select results_eq(
  $$ select username, display_name, bio, is_public, is_owner,
            collection_count, wishlist_count
     from public.get_public_profile(' PUBLIC_LISTENER ') $$,
  $$ values ('public_listener'::text, 'Public Listener'::text,
     'Records with a story.'::text, true, false, 1::bigint, 1::bigint) $$,
  'anonymous visitors receive the public profile and visible counts'
);

select is(
  (select count(*) from public.get_public_profile('private_listener')),
  0::bigint,
  'a private profile is not returned'
);

select is(
  (select count(*) from public.get_public_profile('missing_listener')),
  0::bigint,
  'a missing profile is indistinguishable from a private profile'
);

select results_eq(
  $$ select artist_display, title, format::text, original_year, is_favorite
     from public.get_public_collection_items('public_listener') $$,
  $$ values ('Visible Artist'::text, 'Visible Album'::text, 'lp'::text,
     1971::smallint, true) $$,
  'only the visible collection item and safe release fields are returned'
);

select results_eq(
  $$ select artist_display, title, priority::text, preferred_edition
     from public.get_public_wishlist_items('public_listener') $$,
  $$ values ('Visible Artist'::text, 'Visible Album'::text, 'must_have'::text,
     'Any clean pressing'::text) $$,
  'only the visible wishlist item and public preference are returned'
);

select is(
  (select count(*) from public.get_public_collection_items('private_listener')),
  0::bigint,
  'visible items remain hidden while their profile is private'
);

select is(
  (select count(*) from public.get_public_wishlist_items('private_listener')),
  0::bigint,
  'wishlist items remain hidden while their profile is private'
);

select throws_like(
  $$ select acquired_from from public.get_public_collection_items('public_listener') $$,
  '%column "acquired_from" does not exist%',
  'the collection projection has no purchase-location field'
);

select throws_like(
  $$ select price_paid_minor from public.get_public_collection_items('public_listener') $$,
  '%column "price_paid_minor" does not exist%',
  'the collection projection has no price field'
);

select throws_like(
  $$ select notes from public.get_public_collection_items('public_listener') $$,
  '%column "notes" does not exist%',
  'the collection projection has no personal-notes field'
);

select throws_like(
  $$ select source_data from public.get_public_collection_items('public_listener') $$,
  '%column "source_data" does not exist%',
  'the collection projection has no provider-provenance field'
);

select throws_like(
  $$ select max_price_minor from public.get_public_wishlist_items('public_listener') $$,
  '%column "max_price_minor" does not exist%',
  'the wishlist projection has no target-price field'
);

select throws_like(
  $$ select notes from public.get_public_wishlist_items('public_listener') $$,
  '%column "notes" does not exist%',
  'the wishlist projection has no private-notes field'
);

select throws_like(
  $$ select count(*) from public.releases $$,
  '%permission denied for table releases%',
  'anonymous visitors still cannot query the source release table directly'
);

set local role authenticated;
set local request.jwt.claim.sub = '29292929-2929-4929-8929-292929292929';

select results_eq(
  $$ select username, is_public, is_owner, collection_count, wishlist_count
     from public.get_public_profile('private_listener') $$,
  $$ values ('private_listener'::text, false, true, 1::bigint, 1::bigint) $$,
  'an owner can preview their private profile and visible-item counts'
);

select results_eq(
  $$ select artist_display, title, is_favorite
     from public.get_public_collection_items('private_listener') $$,
  $$ values ('Private Artist'::text, 'Private Album'::text, true) $$,
  'an owner preview receives only opted-in collection items'
);

select results_eq(
  $$ select artist_display, title, priority::text, preferred_edition
     from public.get_public_wishlist_items('private_listener') $$,
  $$ values ('Private Artist'::text, 'Private Album'::text, 'wanted'::text,
     'Visible only in owner preview'::text) $$,
  'an owner preview receives only opted-in wishlist items'
);

set local request.jwt.claim.sub = '19191919-1919-4919-8919-191919191919';

select is(
  (select count(*) from public.get_public_profile('private_listener')),
  0::bigint,
  'another authenticated user cannot preview a private profile'
);

select is(
  (select count(*) from public.get_public_collection_items('private_listener')),
  0::bigint,
  'another authenticated user cannot preview private-profile collection items'
);

select is(
  (select count(*) from public.get_public_wishlist_items('private_listener')),
  0::bigint,
  'another authenticated user cannot preview private-profile wishlist items'
);

select * from finish();
rollback;
