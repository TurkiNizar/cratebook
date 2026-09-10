begin;

select plan(15);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'collector-a@example.test', now(), now()),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'collector-b@example.test', now(), now());

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-4333-8333-333333333333',
  true
);
set local role authenticated;

insert into public.releases (
  id,
  created_by,
  artist_display,
  title,
  format,
  disc_count
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '33333333-3333-4333-8333-333333333333',
  'Miles Davis',
  'Kind of Blue',
  'lp',
  1
);

insert into public.collection_items (
  id,
  user_id,
  release_id,
  entry_key,
  purchase_state,
  price_paid_minor,
  price_currency
)
values
  (
    'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa',
    'used',
    2499,
    'USD'
  ),
  (
    'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-0000-4000-8000-bbbbbbbbbbbb',
    'new',
    null,
    null
  );

select is(
  (select count(*) from public.releases),
  1::bigint,
  'a user can create and read their release'
);
select is(
  (select count(*) from public.collection_items),
  2::bigint,
  'multiple physical copies can reference one release'
);
select is(
  (select is_public from public.collection_items limit 1),
  false,
  'new collection items are private'
);

select throws_like(
  $$
    insert into public.releases (created_by, artist_display, title)
    values ('44444444-4444-4444-8444-444444444444', 'Nina Simone', 'Pastel Blues')
  $$,
  '%new row violates row-level security policy%',
  'a user cannot create a release for another user'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '44444444-4444-4444-8444-444444444444',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.releases),
  0::bigint,
  'another user cannot read private release metadata'
);
select is(
  (select count(*) from public.collection_items),
  0::bigint,
  'another user cannot read collection copies'
);

update public.releases
set title = 'Changed by B'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

update public.collection_items
set notes = 'Changed by B'
where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';

delete from public.collection_items
where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';

reset role;

select is(
  (select title from public.releases where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'Kind of Blue'::text,
  'another user cannot update a release'
);
select is(
  (select notes from public.collection_items where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'),
  null::text,
  'another user cannot update a collection copy'
);
select is(
  (
    select count(*)
    from public.collection_items
    where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'
  ),
  1::bigint,
  'another user cannot delete a collection copy'
);

select throws_like(
  $$
    insert into public.collection_items (user_id, release_id)
    values (
      '44444444-4444-4444-8444-444444444444',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
  $$,
  '%violates foreign key constraint "collection_items_release_owner_fk"%',
  'a user cannot attach another user''s release to their collection'
);

set local role anon;

select throws_like(
  $$ select count(*) from public.releases $$,
  '%permission denied for table releases%',
  'anonymous users cannot query releases'
);
select throws_like(
  $$ select count(*) from public.collection_items $$,
  '%permission denied for table collection_items%',
  'anonymous users cannot query collection copies'
);

reset role;

update public.releases
set updated_at = '2000-01-01 00:00:00+00'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select isnt(
  (
    select updated_at
    from public.releases
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  '2000-01-01 00:00:00+00'::timestamptz,
  'release updates refresh updated_at'
);

delete from public.releases
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (
    select count(*)
    from public.collection_items
    where user_id = '33333333-3333-4333-8333-333333333333'
  ),
  0::bigint,
  'deleting a release removes its physical copies'
);

delete from auth.users
where id in (
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
);

select is(
  (
    select count(*)
    from public.profiles
    where id in (
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    )
  ),
  0::bigint,
  'deleting auth users still cascades to domain data and profiles'
);

select * from finish();
rollback;
