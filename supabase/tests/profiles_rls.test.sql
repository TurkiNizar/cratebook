begin;

select plan(13);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'a@example.test', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'b@example.test', now(), now());

select is(
  (
    select count(*)
    from public.profiles
    where id in (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222'
    )
  ),
  2::bigint,
  'auth signups create exactly one profile each'
);

update public.profiles
set username = 'listener_b', is_public = true
where id = '22222222-2222-4222-8222-222222222222';

set local role anon;

select is(
  (
    select count(*)
    from public.profiles
    where id in (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222'
    )
  ),
  1::bigint,
  'anonymous users see only public profiles'
);

select results_eq(
  $$ select username from public.profiles $$,
  $$ values ('listener_b'::text) $$,
  'the public profile is visible anonymously'
);

reset role;

update public.profiles
set username = 'listener_a'
where id = '11111111-1111-4111-8111-111111111111';

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.profiles
    where id in (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222'
    )
  ),
  2::bigint,
  'an authenticated user sees their private profile and other public profiles'
);

update public.profiles
set display_name = 'Listener A'
where id = '11111111-1111-4111-8111-111111111111';

reset role;

select is(
  (
    select display_name
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  ),
  'Listener A'::text,
  'a user can update their own profile'
);

set local role authenticated;

update public.profiles
set display_name = 'Spoofed'
where id = '22222222-2222-4222-8222-222222222222';

reset role;

select is(
  (
    select display_name
    from public.profiles
    where id = '22222222-2222-4222-8222-222222222222'
  ),
  null::text,
  'a user cannot update another profile'
);

select throws_like(
  $$
    update public.profiles
    set username = null, is_public = true
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  '%violates check constraint "public_profile_requires_username"%',
  'a public profile requires a username'
);

select throws_like(
  $$
    update public.profiles
    set username = 'listener_b'
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  '%violates unique constraint "profiles_username_unique"%',
  'duplicate usernames are rejected'
);

select throws_like(
  $$
    update public.profiles
    set username = 'settings'
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  '%violates check constraint "profiles_username_not_reserved"%',
  'reserved route names are rejected'
);

select throws_like(
  $$
    update public.profiles
    set username = '-invalid'
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  '%violates check constraint "profiles_username_format"%',
  'malformed usernames are rejected'
);

update public.profiles
set updated_at = '2000-01-01 00:00:00+00'
where id = '11111111-1111-4111-8111-111111111111';

select isnt(
  (
    select updated_at
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  ),
  '2000-01-01 00:00:00+00'::timestamptz,
  'the update trigger refreshes updated_at'
);

delete from auth.users
where id = '11111111-1111-4111-8111-111111111111';

select is(
  (
    select count(*)
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  ),
  0::bigint,
  'deleting an auth user removes its profile'
);

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email'
  ),
  0::bigint,
  'the public-safe profiles table contains no email column'
);

select * from finish();
rollback;
