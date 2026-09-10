begin;

select plan(10);

select has_function(
  'public',
  'find_collection_duplicates',
  array['text', 'text'],
  'duplicate lookup function exists'
);

select has_index(
  'public',
  'releases',
  'releases_created_by_normalized_identity_idx',
  'normalized artist and title duplicate lookups are indexed'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('56565656-5656-4656-8656-565656565656', 'authenticated', 'authenticated', 'duplicates-a@example.test', now(), now()),
  ('78787878-7878-4878-8878-787878787878', 'authenticated', 'authenticated', 'duplicates-b@example.test', now(), now());

select set_config('request.jwt.claim.sub', '56565656-5656-4656-8656-565656565656', true);
set local role authenticated;

select is(
  public.create_manual_collection_item(
    'Nina  Simone',
    'Pastel Blues',
    '56565656-0000-4000-8000-000000000001'
  ) is not null,
  true,
  'creates an owned copy for duplicate detection'
);

select is(
  public.create_manual_collection_item(
    'NINA SIMONE',
    'Pastel   Blues',
    '56565656-0000-4000-8000-000000000002'
  ) is not null,
  true,
  'multiple physical copies remain allowed'
);

select is(
  (select count(*) from public.find_collection_duplicates(' nina simone ', ' PASTEL   BLUES ')),
  1::bigint,
  'duplicate lookup ignores case and repeated whitespace'
);

select is(
  (select copy_count from public.find_collection_duplicates('Nina Simone', 'Pastel Blues')),
  2::bigint,
  'duplicate lookup reports the matching physical-copy count'
);

select results_eq(
  $$
    select
      lower(regexp_replace(artist_display, '\s+', ' ', 'g')),
      lower(regexp_replace(title, '\s+', ' ', 'g'))
    from public.find_collection_duplicates('Nina Simone', 'Pastel Blues')
  $$,
  $$ values ('nina simone'::text, 'pastel blues'::text) $$,
  'duplicate lookup returns a normalized-equivalent stored identity'
);

select is(
  (select count(*) from public.find_collection_duplicates('Nina Simone', 'Little Girl Blue')),
  0::bigint,
  'a different title is not a duplicate'
);

reset role;
select set_config('request.jwt.claim.sub', '78787878-7878-4878-8878-787878787878', true);
set local role authenticated;

select is(
  (select count(*) from public.find_collection_duplicates('Nina Simone', 'Pastel Blues')),
  0::bigint,
  'another user cannot see duplicate candidates'
);

set local role anon;
select throws_like(
  $$ select * from public.find_collection_duplicates('Nina Simone', 'Pastel Blues') $$,
  '%permission denied for function find_collection_duplicates%',
  'anonymous visitors cannot invoke duplicate lookup'
);

select * from finish();
rollback;
