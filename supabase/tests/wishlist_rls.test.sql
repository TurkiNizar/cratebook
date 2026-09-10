begin;

select plan(16);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('13131313-1313-4313-8313-131313131313', 'authenticated', 'authenticated', 'wishlist-a@example.test', now(), now()),
  ('14141414-1414-4414-8414-141414141414', 'authenticated', 'authenticated', 'wishlist-b@example.test', now(), now());

select set_config(
  'request.jwt.claim.sub',
  '13131313-1313-4313-8313-131313131313',
  true
);
set local role authenticated;

insert into public.releases (id, created_by, artist_display, title)
values (
  '13131313-aaaa-4aaa-8aaa-131313131313',
  '13131313-1313-4313-8313-131313131313',
  'Alice Coltrane',
  'Journey in Satchidananda'
);

insert into public.wishlist_items (
  id,
  user_id,
  release_id,
  priority,
  preferred_edition,
  max_price_minor,
  price_currency,
  notes
)
values (
  '13131313-bbbb-4bbb-8bbb-131313131313',
  '13131313-1313-4313-8313-131313131313',
  '13131313-aaaa-4aaa-8aaa-131313131313',
  'must_have',
  'Any clean stereo copy',
  7500,
  'USD',
  'Look for this on the next shop visit'
);

select is(
  (select count(*) from public.wishlist_items),
  1::bigint,
  'a user can create and read their wishlist item'
);

select is(
  (select is_public from public.wishlist_items limit 1),
  false,
  'new wishlist items are private'
);

update public.wishlist_items
set priority = 'wanted'
where id = '13131313-bbbb-4bbb-8bbb-131313131313';

select is(
  (
    select priority
    from public.wishlist_items
    where id = '13131313-bbbb-4bbb-8bbb-131313131313'
  ),
  'wanted'::public.wishlist_priority,
  'a user can update their wishlist item'
);

select throws_like(
  $$
    insert into public.wishlist_items (user_id, release_id)
    values (
      '14141414-1414-4414-8414-141414141414',
      '13131313-aaaa-4aaa-8aaa-131313131313'
    )
  $$,
  '%new row violates row-level security policy%',
  'a user cannot create a wishlist item for another user'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '14141414-1414-4414-8414-141414141414',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.wishlist_items),
  0::bigint,
  'another user cannot read wishlist items'
);

select is(
  (select count(*) from public.releases),
  0::bigint,
  'another user cannot read wishlist release metadata'
);

insert into public.releases (id, created_by, artist_display, title)
values (
  '14141414-aaaa-4aaa-8aaa-141414141414',
  '14141414-1414-4414-8414-141414141414',
  'Pharoah Sanders',
  'Karma'
);

select throws_like(
  $$
    insert into public.wishlist_items (user_id, release_id)
    values (
      '14141414-1414-4414-8414-141414141414',
      '13131313-aaaa-4aaa-8aaa-131313131313'
    )
  $$,
  '%violates foreign key constraint "wishlist_items_release_owner_fk"%',
  'a user cannot attach another user''s release to their wishlist'
);

update public.wishlist_items
set notes = 'Changed by B'
where id = '13131313-bbbb-4bbb-8bbb-131313131313';

delete from public.wishlist_items
where id = '13131313-bbbb-4bbb-8bbb-131313131313';

reset role;

select is(
  (
    select notes
    from public.wishlist_items
    where id = '13131313-bbbb-4bbb-8bbb-131313131313'
  ),
  'Look for this on the next shop visit'::text,
  'another user cannot update a wishlist item'
);

select is(
  (
    select count(*)
    from public.wishlist_items
    where id = '13131313-bbbb-4bbb-8bbb-131313131313'
  ),
  1::bigint,
  'another user cannot delete a wishlist item'
);

set local role anon;

select throws_like(
  $$ select count(*) from public.wishlist_items $$,
  '%permission denied for table wishlist_items%',
  'anonymous users cannot query wishlist items'
);

reset role;

update public.wishlist_items
set updated_at = '2000-01-01 00:00:00+00'
where id = '13131313-bbbb-4bbb-8bbb-131313131313';

select isnt(
  (
    select updated_at
    from public.wishlist_items
    where id = '13131313-bbbb-4bbb-8bbb-131313131313'
  ),
  '2000-01-01 00:00:00+00'::timestamptz,
  'wishlist item updates refresh updated_at'
);

select throws_like(
  $$
    insert into public.wishlist_items (user_id, release_id)
    values (
      '13131313-1313-4313-8313-131313131313',
      '14141414-aaaa-4aaa-8aaa-141414141414'
    )
  $$,
  '%violates foreign key constraint "wishlist_items_release_owner_fk"%',
  'a wishlist item cannot reference another user''s release'
);

delete from public.releases
where id = '13131313-aaaa-4aaa-8aaa-131313131313';

select is(
  (
    select count(*)
    from public.wishlist_items
    where id = '13131313-bbbb-4bbb-8bbb-131313131313'
  ),
  0::bigint,
  'deleting a release removes its wishlist item'
);

insert into public.releases (id, created_by, artist_display, title)
values (
  '13131313-cccc-4ccc-8ccc-131313131313',
  '13131313-1313-4313-8313-131313131313',
  'Dorothy Ashby',
  'Afro-Harping'
);

insert into public.wishlist_items (user_id, release_id)
values (
  '13131313-1313-4313-8313-131313131313',
  '13131313-cccc-4ccc-8ccc-131313131313'
);

delete from auth.users
where id = '13131313-1313-4313-8313-131313131313';

select is(
  (
    select count(*)
    from public.wishlist_items
    where user_id = '13131313-1313-4313-8313-131313131313'
  ),
  0::bigint,
  'deleting an auth user cascades to wishlist data'
);

select is(
  (
    select count(*)
    from public.releases
    where created_by = '13131313-1313-4313-8313-131313131313'
  ),
  0::bigint,
  'deleting an auth user cascades to wishlist releases'
);

select is(
  (
    select count(*)
    from public.profiles
    where id = '13131313-1313-4313-8313-131313131313'
  ),
  0::bigint,
  'deleting an auth user still cascades to the profile'
);

select * from finish();
rollback;
