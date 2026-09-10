begin;

select plan(13);

select has_function(
  'public',
  'create_manual_collection_item',
  array[
    'text',
    'text',
    'uuid',
    'release_format',
    'smallint',
    'smallint',
    'smallint',
    'text',
    'text',
    'text',
    'text',
    'boolean',
    'text',
    'text',
    'text'
  ],
  'manual collection entry function exists'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '55555555-5555-4555-8555-555555555555',
  'authenticated',
  'authenticated',
  'manual-entry@example.test',
  now(),
  now()
);

select set_config(
  'request.jwt.claim.sub',
  '55555555-5555-4555-8555-555555555555',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.create_manual_collection_item(
      '  Nina Simone  ',
      '  Pastel Blues  ',
      '55555555-0000-4000-8000-555555555555',
      'lp',
      1::smallint,
      1965::smallint,
      2020::smallint,
      'Philips',
      'PHS 600-187',
      'US',
      'Stereo reissue',
      true,
      'Black',
      '602508910657',
      'A1 600-187'
    )
  $$,
  'an authenticated user can add a manual record'
);

select is(
  (
    select artist_display
    from public.releases
    where created_by = '55555555-5555-4555-8555-555555555555'
  ),
  'Nina Simone'::text,
  'manual entry trims the artist'
);

select is(
  (
    select title
    from public.releases
    where created_by = '55555555-5555-4555-8555-555555555555'
  ),
  'Pastel Blues'::text,
  'manual entry trims the title'
);

select is(
  (
    select format
    from public.releases
    where created_by = '55555555-5555-4555-8555-555555555555'
  ),
  'lp'::public.release_format,
  'manual entry stores optional release metadata'
);

select is(
  (
    select is_public
    from public.collection_items
    where user_id = '55555555-5555-4555-8555-555555555555'
  ),
  false,
  'manual entries remain private by default'
);

select lives_ok(
  $$
    select public.create_manual_collection_item(
      'Nina Simone',
      'Pastel Blues',
      '55555555-0000-4000-8000-555555555555'
    )
  $$,
  'repeating a submission succeeds idempotently'
);

select is(
  (
    select count(*)
    from public.releases
    where created_by = '55555555-5555-4555-8555-555555555555'
  ),
  1::bigint,
  'repeating a submission does not create an orphan release'
);

select is(
  (
    select count(*)
    from public.collection_items
    where user_id = '55555555-5555-4555-8555-555555555555'
  ),
  1::bigint,
  'repeating a submission does not create a duplicate copy'
);

reset role;
set local role anon;

select throws_like(
  $$
    select public.create_manual_collection_item(
      'Miles Davis',
      'Kind of Blue',
      '55555555-0000-4000-8000-aaaaaaaaaaaa'
    )
  $$,
  '%permission denied for function create_manual_collection_item%',
  'anonymous visitors cannot invoke manual entry'
);

reset role;

select throws_like(
  $$
    select public.create_manual_collection_item(
      '',
      'Invalid release',
      '55555555-0000-4000-8000-bbbbbbbbbbbb'
    )
  $$,
  '%violates check constraint "releases_artist_required"%',
  'invalid release metadata rolls back the manual entry'
);

select is(
  (
    select count(*)
    from public.releases
    where created_by = '55555555-5555-4555-8555-555555555555'
  ),
  1::bigint,
  'a failed manual entry leaves no orphan release'
);

select throws_like(
  $$
    insert into public.releases (created_by, artist_display, title, label)
    values (
      '55555555-5555-4555-8555-555555555555',
      'Artist',
      'Title',
      repeat('x', 301)
    )
  $$,
  '%violates check constraint "releases_label_length"%',
  'database validation rejects oversized optional metadata'
);

select * from finish();
rollback;
