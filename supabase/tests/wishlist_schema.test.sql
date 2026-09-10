begin;

select plan(26);

select has_type('public', 'wishlist_priority', 'wishlist priority type exists');
select has_table('public', 'wishlist_items', 'wishlist items table exists');
select has_pk('public', 'wishlist_items', 'wishlist items has a primary key');

select results_eq(
  $$
    select enumlabel
    from pg_enum
    where enumtypid = 'public.wishlist_priority'::regtype
    order by enumsortorder
  $$,
  $$ values
    ('interested'::name),
    ('wanted'::name),
    ('must_have'::name)
  $$,
  'wishlist priorities use the agreed vocabulary'
);

select col_not_null('public', 'wishlist_items', 'user_id', 'wishlist owner is required');
select col_not_null('public', 'wishlist_items', 'release_id', 'wishlist release is required');
select col_not_null('public', 'wishlist_items', 'priority', 'wishlist priority is required');
select col_not_null('public', 'wishlist_items', 'is_public', 'wishlist visibility is required');
select col_has_default('public', 'wishlist_items', 'id', 'wishlist ids are generated');
select col_has_default('public', 'wishlist_items', 'entry_key', 'wishlist entry keys are generated');
select col_has_default('public', 'wishlist_items', 'priority', 'wishlist priority has a default');
select col_has_default('public', 'wishlist_items', 'is_public', 'wishlist items are private by default');

select has_index(
  'public',
  'wishlist_items',
  'wishlist_items_user_release_unique',
  'one active wishlist item is allowed per user and release'
);

select has_index(
  'public',
  'wishlist_items',
  'wishlist_items_entry_key_unique',
  'wishlist entry keys are unique per user'
);

select has_index(
  'public',
  'wishlist_items',
  'wishlist_items_user_priority_created_at_idx',
  'wishlist priority browsing is indexed per user'
);

select has_trigger(
  'public',
  'wishlist_items',
  'wishlist_items_touch_updated_at',
  'wishlist item updates refresh updated_at'
);

select fk_ok(
  'public',
  'wishlist_items',
  array['release_id', 'user_id'],
  'public',
  'releases',
  array['id', 'created_by'],
  'wishlist items can only reference a release owned by the same user'
);

select policies_are(
  'public',
  'wishlist_items',
  array[
    'wishlist_items_delete_own',
    'wishlist_items_insert_own',
    'wishlist_items_select_own',
    'wishlist_items_update_own'
  ],
  'wishlist items expose only owner policies'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.wishlist_items'::regclass),
  true,
  'wishlist row-level security is enabled'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('12121212-1212-4212-8212-121212121212', 'authenticated', 'authenticated', 'wishlist-schema@example.test', now(), now());

insert into public.releases (id, created_by, artist_display, title)
values (
  '12121212-aaaa-4aaa-8aaa-121212121212',
  '12121212-1212-4212-8212-121212121212',
  'Nina Simone',
  'Pastel Blues'
);

insert into public.wishlist_items (user_id, release_id)
values (
  '12121212-1212-4212-8212-121212121212',
  '12121212-aaaa-4aaa-8aaa-121212121212'
);

select results_eq(
  $$
    select priority, is_public
    from public.wishlist_items
    where user_id = '12121212-1212-4212-8212-121212121212'
  $$,
  $$ values ('interested'::public.wishlist_priority, false) $$,
  'new wishlist items use safe defaults'
);

select throws_like(
  $$ insert into public.wishlist_items (user_id, release_id)
     values (
       '12121212-1212-4212-8212-121212121212',
       '12121212-aaaa-4aaa-8aaa-121212121212'
     ) $$,
  '%wishlist_items_user_release_unique%',
  'a release can appear only once on a user''s wishlist'
);

select throws_like(
  $$ update public.wishlist_items
     set max_price_minor = 2500
     where user_id = '12121212-1212-4212-8212-121212121212' $$,
  '%wishlist_items_price_complete%',
  'target prices require a currency'
);

select throws_like(
  $$ update public.wishlist_items
     set max_price_minor = 2500, price_currency = 'usd'
     where user_id = '12121212-1212-4212-8212-121212121212' $$,
  '%wishlist_items_currency_format%',
  'target price currencies use uppercase three-letter codes'
);

select throws_like(
  $$ update public.wishlist_items
     set max_price_minor = -1, price_currency = 'USD'
     where user_id = '12121212-1212-4212-8212-121212121212' $$,
  '%wishlist_items_max_price_nonnegative%',
  'target prices cannot be negative'
);

select throws_like(
  $$ update public.wishlist_items
     set preferred_edition = repeat('a', 1001)
     where user_id = '12121212-1212-4212-8212-121212121212' $$,
  '%wishlist_items_preferred_edition_length%',
  'preferred edition notes have a bounded length'
);

select throws_like(
  $$ update public.wishlist_items
     set notes = repeat('a', 10001)
     where user_id = '12121212-1212-4212-8212-121212121212' $$,
  '%wishlist_items_notes_length%',
  'wishlist notes have a bounded length'
);

select * from finish();
rollback;
