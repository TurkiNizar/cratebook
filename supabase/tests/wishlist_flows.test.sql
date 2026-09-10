begin;

select plan(17);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('15151515-1515-4515-8515-151515151515', 'authenticated', 'authenticated', 'wishlist-flow-a@example.test', now(), now()),
  ('16161616-1616-4616-8616-161616161616', 'authenticated', 'authenticated', 'wishlist-flow-b@example.test', now(), now());

select set_config('request.jwt.claim.sub', '15151515-1515-4515-8515-151515151515', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_manual_wishlist_item(
    ' Alice Coltrane ',
    ' Journey in Satchidananda ',
    '15151515-aaaa-4aaa-8aaa-151515151515',
    'must_have',
    ' Impulse stereo pressing ',
    7500,
    'usd',
    ' Check the sleeve. ',
    true
  ) $$,
  'an authenticated user can create a manual wishlist item'
);

select is((select count(*) from public.releases), 1::bigint, 'creation adds one release');
select is((select count(*) from public.wishlist_items), 1::bigint, 'creation adds one wishlist item');
select results_eq(
  $$ select artist_display, title from public.releases $$,
  $$ values ('Alice Coltrane'::text, 'Journey in Satchidananda'::text) $$,
  'creation trims release identity'
);
select results_eq(
  $$ select priority, preferred_edition, max_price_minor, price_currency, notes, is_public from public.wishlist_items $$,
  $$ values ('must_have'::public.wishlist_priority, 'Impulse stereo pressing'::text, 7500::bigint, 'USD'::text, 'Check the sleeve.'::text, true) $$,
  'creation stores normalized wishlist preferences'
);

select is(
  public.create_manual_wishlist_item(
    'Ignored',
    'Ignored',
    '15151515-aaaa-4aaa-8aaa-151515151515'
  ),
  (select id from public.wishlist_items),
  'reusing an entry key returns the original wishlist item'
);
select is((select count(*) from public.releases), 1::bigint, 'idempotent retry does not add a release');
select is((select count(*) from public.wishlist_items), 1::bigint, 'idempotent retry does not add a wishlist item');

select set_config(
  'test.wishlist_item_id',
  (select id::text from public.wishlist_items),
  true
);

select ok(
  public.update_wishlist_item_details(
    (select id from public.wishlist_items),
    'Alice Coltrane',
    'Journey in Satchidananda — Reissue',
    'wanted',
    null,
    null,
    null,
    null,
    false
  ),
  'the owner can update a wishlist item'
);
select results_eq(
  $$ select title from public.releases $$,
  $$ values ('Journey in Satchidananda — Reissue'::text) $$,
  'editing updates the release identity'
);
select results_eq(
  $$ select priority, preferred_edition, max_price_minor, price_currency, notes, is_public from public.wishlist_items $$,
  $$ values ('wanted'::public.wishlist_priority, null::text, null::bigint, null::text, null::text, false) $$,
  'editing can clear optional wishlist preferences'
);

reset role;
select set_config('request.jwt.claim.sub', '16161616-1616-4616-8616-161616161616', true);
set local role authenticated;

select is(
  public.update_wishlist_item_details(
    current_setting('test.wishlist_item_id')::uuid,
    'No',
    'Access',
    'interested'
  ),
  false,
  'another user cannot update an owner item'
);
select is(
  public.delete_wishlist_item(current_setting('test.wishlist_item_id')::uuid),
  false,
  'another user cannot delete an owner item'
);

reset role;
select set_config('request.jwt.claim.sub', '15151515-1515-4515-8515-151515151515', true);
set local role authenticated;

insert into public.collection_items (user_id, release_id)
select user_id, release_id from public.wishlist_items;

select ok(
  public.delete_wishlist_item((select id from public.wishlist_items)),
  'the owner can delete a wishlist item'
);
select is((select count(*) from public.wishlist_items), 0::bigint, 'deletion removes the wishlist item');
select is((select count(*) from public.releases), 1::bigint, 'deletion preserves a release used by the collection');
select is((select count(*) from public.collection_items), 1::bigint, 'deletion preserves the physical copy');

select * from finish();
rollback;
