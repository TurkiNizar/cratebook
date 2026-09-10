begin;

select plan(16);

select has_table('public', 'tags', 'tags table exists');
select has_pk('public', 'tags', 'tags has a primary key');
select has_table('public', 'collection_item_tags', 'collection item tags table exists');
select has_pk('public', 'collection_item_tags', 'collection item tags has a primary key');
select col_not_null('public', 'tags', 'user_id', 'tag owner is required');
select col_not_null('public', 'tags', 'name', 'tag name is required');
select col_not_null('public', 'collection_item_tags', 'user_id', 'tag association owner is required');

select has_index(
  'public',
  'tags',
  'tags_normalized_name_unique',
  'normalized tag names are unique per user'
);

select fk_ok(
  'public',
  'collection_item_tags',
  array['collection_item_id', 'user_id'],
  'public',
  'collection_items',
  array['id', 'user_id'],
  'tag associations require a collection item with the same owner'
);

select fk_ok(
  'public',
  'collection_item_tags',
  array['tag_id', 'user_id'],
  'public',
  'tags',
  array['id', 'user_id'],
  'tag associations require a tag with the same owner'
);

select policies_are(
  'public',
  'tags',
  array['tags_delete_own', 'tags_insert_own', 'tags_select_own', 'tags_update_own'],
  'tags expose only owner policies'
);

select policies_are(
  'public',
  'collection_item_tags',
  array[
    'collection_item_tags_delete_own',
    'collection_item_tags_insert_own',
    'collection_item_tags_select_own'
  ],
  'tag associations expose only owner policies'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.tags'::regclass),
  true,
  'tag row-level security is enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.collection_item_tags'::regclass),
  true,
  'tag association row-level security is enabled'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated', 'tag-schema@example.test', now(), now());

insert into public.tags (user_id, name)
values ('99999999-9999-4999-8999-999999999999', 'Jazz');

select throws_like(
  $$ insert into public.tags (user_id, name)
     values ('99999999-9999-4999-8999-999999999999', 'jazz') $$,
  '%tags_normalized_name_unique%',
  'tag names are case-insensitively unique per user'
);

select throws_like(
  $$ insert into public.tags (user_id, name)
     values ('99999999-9999-4999-8999-999999999999', '') $$,
  '%tags_name_valid%',
  'blank tag names are rejected'
);

select * from finish();
rollback;
