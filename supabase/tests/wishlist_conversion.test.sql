begin;

select plan(18);

select has_function(
  'public',
  'convert_wishlist_item_to_collection',
  array[
    'uuid',
    'uuid',
    'purchase_state',
    'record_condition',
    'record_condition',
    'date',
    'text',
    'bigint',
    'text',
    'smallint',
    'boolean',
    'text',
    'text[]'
  ],
  'wishlist conversion function exists'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('17171717-1717-4717-8717-171717171717', 'authenticated', 'authenticated', 'conversion-a@example.test', now(), now()),
  ('18181818-1818-4818-8818-181818181818', 'authenticated', 'authenticated', 'conversion-b@example.test', now(), now());

insert into public.releases (id, created_by, artist_display, title, format, label)
values (
  '17171717-aaaa-4aaa-8aaa-171717171717',
  '17171717-1717-4717-8717-171717171717',
  'Alice Coltrane',
  'Journey in Satchidananda',
  'lp',
  'Impulse!'
);

insert into public.wishlist_items (id, user_id, release_id, notes, is_public)
values (
  '17171717-bbbb-4bbb-8bbb-171717171717',
  '17171717-1717-4717-8717-171717171717',
  '17171717-aaaa-4aaa-8aaa-171717171717',
  'Check the sleeve.',
  true
);

select set_config('request.jwt.claim.sub', '17171717-1717-4717-8717-171717171717', true);
set local role authenticated;

select lives_ok(
  $$ select public.convert_wishlist_item_to_collection(
    '17171717-bbbb-4bbb-8bbb-171717171717',
    '17171717-cccc-4ccc-8ccc-171717171717',
    'used'::public.purchase_state,
    'near_mint'::public.record_condition,
    'very_good_plus'::public.record_condition,
    '2026-09-10'::date,
    ' Local record shop ',
    6000::bigint,
    'usd',
    5::smallint,
    true,
    ' Check the sleeve. Found a clean copy. ',
    array['Jazz', ' Spiritual   jazz ', 'jazz']
  ) $$,
  'the owner can convert a wishlist item'
);

select is(
  (select count(*) from public.wishlist_items where id = '17171717-bbbb-4bbb-8bbb-171717171717'),
  0::bigint,
  'conversion removes the wishlist item'
);
select is(
  (select count(*) from public.collection_items where entry_key = '17171717-cccc-4ccc-8ccc-171717171717'),
  1::bigint,
  'conversion creates one physical copy'
);
select is(
  (select count(*) from public.releases where id = '17171717-aaaa-4aaa-8aaa-171717171717'),
  1::bigint,
  'conversion reuses the wishlist release'
);
select results_eq(
  $$ select artist_display, title, format, label from public.releases where id = '17171717-aaaa-4aaa-8aaa-171717171717' $$,
  $$ values ('Alice Coltrane'::text, 'Journey in Satchidananda'::text, 'lp'::public.release_format, 'Impulse!'::text) $$,
  'conversion preserves release metadata'
);
select results_eq(
  $$ select purchase_state, media_condition, sleeve_condition, acquired_on, acquired_from, price_paid_minor, price_currency, rating, is_favorite, notes, is_public from public.collection_items where entry_key = '17171717-cccc-4ccc-8ccc-171717171717' $$,
  $$ values ('used'::public.purchase_state, 'near_mint'::public.record_condition, 'very_good_plus'::public.record_condition, '2026-09-10'::date, 'Local record shop'::text, 6000::bigint, 'USD'::text, 5::smallint, true, 'Check the sleeve. Found a clean copy.'::text, false) $$,
  'conversion stores normalized copy details and keeps the copy private'
);
select results_eq(
  $$ select name from public.tags where user_id = '17171717-1717-4717-8717-171717171717' order by normalized_name $$,
  $$ values ('Jazz'::text), ('Spiritual jazz'::text) $$,
  'conversion normalizes and deduplicates tags'
);
select is(
  (select count(*) from public.collection_item_tags where user_id = '17171717-1717-4717-8717-171717171717'),
  2::bigint,
  'conversion attaches tags to the new copy'
);

select is(
  public.convert_wishlist_item_to_collection(
    '17171717-bbbb-4bbb-8bbb-171717171717',
    '17171717-cccc-4ccc-8ccc-171717171717',
    'unknown'::public.purchase_state, null, null, null, null, null, null, null, false, null, array[]::text[]
  ),
  (select id from public.collection_items where entry_key = '17171717-cccc-4ccc-8ccc-171717171717'),
  'repeating a conversion returns the original physical copy'
);
select is(
  (select count(*) from public.collection_items where entry_key = '17171717-cccc-4ccc-8ccc-171717171717'),
  1::bigint,
  'an idempotent retry does not create another copy'
);

reset role;

insert into public.releases (id, created_by, artist_display, title)
values (
  '17171717-dddd-4ddd-8ddd-171717171717',
  '17171717-1717-4717-8717-171717171717',
  'Pharoah Sanders',
  'Karma'
);
insert into public.wishlist_items (id, user_id, release_id)
values (
  '17171717-eeee-4eee-8eee-171717171717',
  '17171717-1717-4717-8717-171717171717',
  '17171717-dddd-4ddd-8ddd-171717171717'
);

select set_config('request.jwt.claim.sub', '18181818-1818-4818-8818-181818181818', true);
set local role authenticated;

select is(
  public.convert_wishlist_item_to_collection(
    '17171717-eeee-4eee-8eee-171717171717',
    '18181818-aaaa-4aaa-8aaa-181818181818',
    'unknown'::public.purchase_state, null, null, null, null, null, null, null, false, null, array[]::text[]
  ),
  null::uuid,
  'another user cannot convert an owned wishlist item'
);

reset role;
select is(
  (select count(*) from public.wishlist_items where id = '17171717-eeee-4eee-8eee-171717171717'),
  1::bigint,
  'a cross-user attempt leaves the wishlist item intact'
);
select is(
  (select count(*) from public.collection_items where release_id = '17171717-dddd-4ddd-8ddd-171717171717'),
  0::bigint,
  'a cross-user attempt creates no copy'
);

select set_config('request.jwt.claim.sub', '17171717-1717-4717-8717-171717171717', true);
set local role authenticated;

select throws_like(
  $$ select public.convert_wishlist_item_to_collection(
    '17171717-eeee-4eee-8eee-171717171717',
    '17171717-ffff-4fff-8fff-171717171717',
    'used'::public.purchase_state, null, null, null, null, (-1)::bigint, 'USD', null, false, null, array[]::text[]
  ) $$,
  '%violates check constraint "collection_items_price_nonnegative"%',
  'invalid copy details fail the conversion'
);

select is(
  (select count(*) from public.wishlist_items where id = '17171717-eeee-4eee-8eee-171717171717'),
  1::bigint,
  'a failed conversion keeps the wishlist item'
);
select is(
  (select count(*) from public.collection_items where release_id = '17171717-dddd-4ddd-8ddd-171717171717'),
  0::bigint,
  'a failed conversion leaves no partial copy'
);

reset role;
set local role anon;

select throws_like(
  $$ select public.convert_wishlist_item_to_collection(
    '17171717-eeee-4eee-8eee-171717171717',
    '17171717-ffff-4fff-8fff-171717171717',
    'unknown'::public.purchase_state, null, null, null, null, null, null, null, false, null, array[]::text[]
  ) $$,
  '%permission denied for function convert_wishlist_item_to_collection%',
  'anonymous visitors cannot invoke conversion'
);

select * from finish();
rollback;
