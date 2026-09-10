begin;

select plan(18);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('12121212-1212-4212-8212-121212121212', 'authenticated', 'authenticated', 'search-a@example.test', now(), now()),
  ('34343434-3434-4434-8434-343434343434', 'authenticated', 'authenticated', 'search-b@example.test', now(), now());

select set_config('request.jwt.claim.sub', '12121212-1212-4212-8212-121212121212', true);
set local role authenticated;

select is(
  public.create_manual_collection_item('Nina Simone', 'Pastel Blues', '12121212-0000-4000-8000-000000000001') is not null,
  true,
  'creates the first searchable copy'
);
select is(
  public.create_manual_collection_item('Sade', 'Diamond Life', '12121212-0000-4000-8000-000000000002') is not null,
  true,
  'creates the second searchable copy'
);
select is(
  public.create_manual_collection_item('Alice Coltrane', 'Journey in Satchidananda', '12121212-0000-4000-8000-000000000003') is not null,
  true,
  'creates the third searchable copy'
);

select is(
  public.update_collection_item_details(
    p_item_id => (select id from public.collection_items where entry_key = '12121212-0000-4000-8000-000000000001'),
    p_artist_display => 'Nina Simone',
    p_title => 'Pastel Blues',
    p_format => 'lp',
    p_label => 'Philips',
    p_catalog_number => 'PHS 600-187',
    p_purchase_state => 'used',
    p_media_condition => 'near_mint',
    p_acquired_on => '2026-09-09',
    p_is_favorite => true,
    p_notes => 'A late-night favorite.',
    p_tags => array['Jazz', 'Sunday morning']
  ),
  true,
  'adds searchable metadata to the first copy'
);

select is(
  public.update_collection_item_details(
    p_item_id => (select id from public.collection_items where entry_key = '12121212-0000-4000-8000-000000000002'),
    p_artist_display => 'Sade',
    p_title => 'Diamond Life',
    p_format => 'lp',
    p_purchase_state => 'new',
    p_sleeve_condition => 'very_good_plus',
    p_acquired_on => '2026-09-10'
  ),
  true,
  'adds filter metadata to the second copy'
);

select is(
  public.update_collection_item_details(
    p_item_id => (select id from public.collection_items where entry_key = '12121212-0000-4000-8000-000000000003'),
    p_artist_display => 'Alice Coltrane',
    p_title => 'Journey in Satchidananda',
    p_format => 'box_set'
  ),
  true,
  'adds filter metadata to the third copy'
);

select results_eq(
  $$ select title from public.search_collection_items(p_query => 'blue') $$,
  $$ values ('Pastel Blues'::text) $$,
  'search matches a title case-insensitively'
);
select results_eq(
  $$ select title from public.search_collection_items(p_query => 'PHS 600') $$,
  $$ values ('Pastel Blues'::text) $$,
  'search matches a catalog number'
);
select results_eq(
  $$ select title from public.search_collection_items(p_query => 'late-night') $$,
  $$ values ('Pastel Blues'::text) $$,
  'search includes private notes for the owner'
);
select results_eq(
  $$ select title from public.search_collection_items(p_query => 'sunday') $$,
  $$ values ('Pastel Blues'::text) $$,
  'search matches tags'
);
select results_eq(
  $$ select title from public.search_collection_items(p_favorite => true) $$,
  $$ values ('Pastel Blues'::text) $$,
  'favorite filtering works'
);
select results_eq(
  $$ select title from public.search_collection_items(p_purchase_state => 'new') $$,
  $$ values ('Diamond Life'::text) $$,
  'purchase-state filtering works'
);
select results_eq(
  $$ select title from public.search_collection_items(p_condition => 'very_good_plus') $$,
  $$ values ('Diamond Life'::text) $$,
  'condition filtering checks media and sleeve grades'
);
select results_eq(
  $$ select title from public.search_collection_items(p_format => 'box_set') $$,
  $$ values ('Journey in Satchidananda'::text) $$,
  'format filtering works'
);
select results_eq(
  $$ select title from public.search_collection_items(p_sort => 'acquired') $$,
  $$ values ('Diamond Life'::text), ('Pastel Blues'::text), ('Journey in Satchidananda'::text) $$,
  'recently acquired sorting places dated copies first and undated copies last'
);
select results_eq(
  $$ select artist_display from public.search_collection_items(p_sort => 'artist') $$,
  $$ values ('Alice Coltrane'::text), ('Nina Simone'::text), ('Sade'::text) $$,
  'artist sorting is alphabetical'
);
select results_eq(
  $$ select title from public.search_collection_items(p_sort => 'title') $$,
  $$ values ('Diamond Life'::text), ('Journey in Satchidananda'::text), ('Pastel Blues'::text) $$,
  'title sorting is alphabetical'
);

reset role;
select set_config('request.jwt.claim.sub', '34343434-3434-4434-8434-343434343434', true);
set local role authenticated;

select is(
  (select count(*) from public.search_collection_items()),
  0::bigint,
  'another user cannot search the owner collection'
);

select * from finish();
rollback;
