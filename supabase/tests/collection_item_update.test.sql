begin;

select plan(7);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'details-a@example.test', now(), now()),
  ('88888888-8888-4888-8888-888888888888', 'authenticated', 'authenticated', 'details-b@example.test', now(), now());

select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
set local role authenticated;

select is(
  public.create_manual_collection_item(
    'Nina Simone',
    'Pastel Blues',
    '77777777-0000-4000-8000-777777777777'
  ) is not null,
  true,
  'the owner can create the copy used by the update journey'
);

select is(
  public.update_collection_item_details(
    p_item_id => (
      select id from public.collection_items
      where entry_key = '77777777-0000-4000-8000-777777777777'
    ),
    p_artist_display => 'Nina Simone',
    p_title => 'Pastel Blues — Mono',
    p_format => 'lp'::public.release_format,
    p_purchase_state => 'used'::public.purchase_state,
    p_media_condition => 'near_mint'::public.record_condition,
    p_sleeve_condition => 'very_good_plus'::public.record_condition,
    p_acquired_on => '2026-09-10'::date,
    p_acquired_from => 'Local record shop',
    p_price_paid_minor => 2499::bigint,
    p_price_currency => 'usd',
    p_rating => 5::smallint,
    p_is_favorite => true,
    p_notes => 'A late-night favorite.'
  ),
  true,
  'the owner can atomically update release and physical-copy details'
);

select results_eq(
  $$
    select purchase_state::text, media_condition::text, sleeve_condition::text,
      acquired_on::text, acquired_from, price_paid_minor, price_currency, rating,
      is_favorite, notes
    from public.collection_items
    where entry_key = '77777777-0000-4000-8000-777777777777'
  $$,
  $$ values (
    'used'::text, 'near_mint'::text, 'very_good_plus'::text,
    '2026-09-10'::text, 'Local record shop'::text, 2499::bigint, 'USD'::text,
    5::smallint, true, 'A late-night favorite.'::text
  ) $$,
  'copy details are normalized and stored'
);

select throws_like(
  $$
    select public.update_collection_item_details(
      p_item_id => (
        select id from public.collection_items
        where entry_key = '77777777-0000-4000-8000-777777777777'
      ),
      p_artist_display => 'Nina Simone',
      p_title => '',
      p_rating => 1::smallint
    )
  $$,
  '%releases_title_required%',
  'an invalid release update fails the combined operation'
);

select is(
  (
    select rating from public.collection_items
    where entry_key = '77777777-0000-4000-8000-777777777777'
  ),
  5::smallint,
  'a failed release update rolls back the physical-copy update'
);

select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888888', true);

select is(
  public.update_collection_item_details(
    p_item_id => (
      select id from public.collection_items
      where entry_key = '77777777-0000-4000-8000-777777777777'
    ),
    p_artist_display => 'Changed',
    p_title => 'Changed'
  ),
  false,
  'another user cannot update the physical copy or release'
);

reset role;

select is(
  (
    select title from public.releases
    where created_by = '77777777-7777-4777-8777-777777777777'
  ),
  'Pastel Blues — Mono'::text,
  'another user cannot change the release metadata'
);

select * from finish();
rollback;
