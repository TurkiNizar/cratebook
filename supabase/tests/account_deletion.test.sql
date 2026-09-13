begin;

select plan(7);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'delete-me@example.test',
  now(),
  now()
);

update public.profiles
set
  username = 'delete_me',
  avatar_path = 'avatars/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/profile.jpg'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

insert into public.releases (
  id,
  created_by,
  title,
  artist_display
)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Pastel Blues',
  'Nina Simone'
);

insert into public.collection_items (
  id,
  user_id,
  release_id,
  entry_key
)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
);

insert into public.wishlist_items (
  id,
  user_id,
  release_id,
  entry_key
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'ffffffff-ffff-4fff-8fff-ffffffffffff'
);

insert into public.tags (id, user_id, name)
values (
  '12121212-1212-4121-8121-121212121212',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Delete me'
);

insert into public.collection_item_tags (collection_item_id, tag_id, user_id)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '12121212-1212-4121-8121-121212121212',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

delete from auth.users
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select count(*) from auth.users where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes the authentication user'
);

select is(
  (select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes the profile and its image reference'
);

select is(
  (select count(*) from public.releases where created_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes owner-scoped release metadata'
);

select is(
  (select count(*) from public.collection_items where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes collection items'
);

select is(
  (select count(*) from public.wishlist_items where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes wishlist items'
);

select is(
  (select count(*) from public.tags where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes tags'
);

select is(
  (select count(*) from public.collection_item_tags where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion removes collection tag assignments'
);

select * from finish();
rollback;
