begin;

select plan(10);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'tags-a@example.test', now(), now()),
  ('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'tags-b@example.test', now(), now());

select set_config('request.jwt.claim.sub', 'aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa', true);
set local role authenticated;

select is(
  public.create_manual_collection_item(
    'Alice Coltrane',
    'Journey in Satchidananda',
    'aaaaaaaa-9999-4000-8000-aaaaaaaaaaaa'
  ) is not null,
  true,
  'the owner can create a copy for tagging'
);

select is(
  public.update_collection_item_details(
    p_item_id => (
      select id from public.collection_items
      where entry_key = 'aaaaaaaa-9999-4000-8000-aaaaaaaaaaaa'
    ),
    p_artist_display => 'Alice Coltrane',
    p_title => 'Journey in Satchidananda',
    p_tags => array['Jazz', ' Spiritual   jazz ', 'jazz']
  ),
  true,
  'the owner can atomically assign normalized tags'
);

select is((select count(*) from public.tags), 2::bigint, 'duplicate tag names are reused');
select is((select count(*) from public.collection_item_tags), 2::bigint, 'both unique tags are attached');
select results_eq(
  $$ select name from public.tags order by normalized_name $$,
  $$ values ('Jazz'::text), ('Spiritual jazz'::text) $$,
  'tag display names are trimmed and internal whitespace is collapsed'
);

reset role;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb', true);
set local role authenticated;

select is((select count(*) from public.tags), 0::bigint, 'another user cannot read tags');
select is((select count(*) from public.collection_item_tags), 0::bigint, 'another user cannot read tag associations');
select is(
  public.update_collection_item_details(
    p_item_id => (
      select id from public.collection_items
      where entry_key = 'aaaaaaaa-9999-4000-8000-aaaaaaaaaaaa'
    ),
    p_artist_display => 'Changed',
    p_title => 'Changed',
    p_tags => array['Stolen']
  ),
  false,
  'another user cannot replace tags through the update function'
);

set local role anon;
select throws_like(
  $$ select count(*) from public.tags $$,
  '%permission denied for table tags%',
  'anonymous users cannot query tags'
);
select throws_like(
  $$ select count(*) from public.collection_item_tags $$,
  '%permission denied for table collection_item_tags%',
  'anonymous users cannot query tag associations'
);

select * from finish();
rollback;
