begin;

select plan(8);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('41414141-4141-4141-8141-414141414141', 'authenticated', 'authenticated', 'review-owner@example.test', now(), now()),
  ('42424242-4242-4242-8242-424242424242', 'authenticated', 'authenticated', 'review-visitor@example.test', now(), now());

update public.profiles
set
  username = case id
    when '41414141-4141-4141-8141-414141414141' then 'review_owner'
    else 'review_visitor'
  end,
  display_name = 'Security review profile',
  avatar_path = 'reserved/private/path.png',
  is_public = true
where id in (
  '41414141-4141-4141-8141-414141414141',
  '42424242-4242-4242-8242-424242424242'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anonymous visitors cannot read the profiles table directly'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated owners retain direct profile reads'
);

set local role anon;

select throws_like(
  $$ select * from public.profiles $$,
  '%permission denied for table profiles%',
  'anonymous direct profile queries are denied'
);

select results_eq(
  $$ select username, display_name, is_owner
     from public.get_public_profile('review_owner') $$,
  $$ values ('review_owner'::text, 'Security review profile'::text, false) $$,
  'anonymous visitors still receive the narrow public profile projection'
);

select throws_like(
  $$ select avatar_path from public.get_public_profile('review_owner') $$,
  '%column "avatar_path" does not exist%',
  'the public projection cannot expose the reserved avatar storage path'
);

set local role authenticated;
set local request.jwt.claim.sub = '42424242-4242-4242-8242-424242424242';

select is(
  (select count(*) from public.profiles where id = '41414141-4141-4141-8141-414141414141'),
  0::bigint,
  'an authenticated visitor cannot read another public profile table row'
);

select is(
  (select count(*) from public.profiles where id = '42424242-4242-4242-8242-424242424242'),
  1::bigint,
  'an authenticated owner can read their own profile table row'
);

select results_eq(
  $$ select username, is_owner
     from public.get_public_profile('review_owner') $$,
  $$ values ('review_owner'::text, false) $$,
  'authenticated visitors use the same narrow projection for other public profiles'
);

select * from finish();

rollback;
