begin;

select plan(29);

select has_table('public', 'releases', 'releases table exists');
select has_pk('public', 'releases', 'releases has a primary key');
select has_table('public', 'collection_items', 'collection_items table exists');
select has_pk('public', 'collection_items', 'collection_items has a primary key');

select results_eq(
  $$
    select enumlabel
    from pg_enum
    where enumtypid = 'public.release_format'::regtype
    order by enumsortorder
  $$,
  $$ values
    ('lp'::name),
    ('seven_inch'::name),
    ('ten_inch'::name),
    ('twelve_inch'::name),
    ('box_set'::name),
    ('other'::name)
  $$,
  'release formats use the agreed vocabulary'
);

select results_eq(
  $$
    select enumlabel
    from pg_enum
    where enumtypid = 'public.record_condition'::regtype
    order by enumsortorder
  $$,
  $$ values
    ('mint'::name),
    ('near_mint'::name),
    ('very_good_plus'::name),
    ('very_good'::name),
    ('good_plus'::name),
    ('good'::name),
    ('fair'::name),
    ('poor'::name)
  $$,
  'record conditions use Goldmine grades'
);

select results_eq(
  $$
    select enumlabel
    from pg_enum
    where enumtypid = 'public.purchase_state'::regtype
    order by enumsortorder
  $$,
  $$ values ('new'::name), ('used'::name), ('unknown'::name) $$,
  'purchase state distinguishes new, used, and unknown copies'
);

select col_not_null('public', 'releases', 'artist_display', 'artist is required');
select col_not_null('public', 'releases', 'title', 'title is required');
select col_not_null('public', 'releases', 'created_by', 'release owner is required');
select col_has_default('public', 'releases', 'id', 'release ids are generated');
select col_has_default('public', 'collection_items', 'id', 'collection item ids are generated');
select col_has_default('public', 'collection_items', 'entry_key', 'entry keys are generated');
select col_has_default('public', 'collection_items', 'purchase_state', 'purchase state defaults safely');
select col_has_default('public', 'collection_items', 'is_favorite', 'favorite defaults false');
select col_has_default('public', 'collection_items', 'is_public', 'collection items are private by default');

select has_index(
  'public',
  'collection_items',
  'collection_items_entry_key_unique',
  'entry keys are unique per user'
);
select has_index(
  'public',
  'releases',
  'releases_created_by_artist_title_idx',
  'artist and title lookup is indexed per user'
);
select has_trigger(
  'public',
  'releases',
  'releases_touch_updated_at',
  'release updates refresh updated_at'
);
select has_trigger(
  'public',
  'collection_items',
  'collection_items_touch_updated_at',
  'collection item updates refresh updated_at'
);

select fk_ok(
  'public',
  'collection_items',
  array['release_id', 'user_id'],
  'public',
  'releases',
  array['id', 'created_by'],
  'collection items can only reference a release owned by the same user'
);

select policies_are(
  'public',
  'releases',
  array[
    'releases_delete_own',
    'releases_insert_own',
    'releases_select_own',
    'releases_update_own'
  ],
  'releases expose only owner policies'
);
select policies_are(
  'public',
  'collection_items',
  array[
    'collection_items_delete_own',
    'collection_items_insert_own',
    'collection_items_select_own',
    'collection_items_update_own'
  ],
  'collection items expose only owner policies'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.releases'::regclass),
  true,
  'release row-level security is enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.collection_items'::regclass),
  true,
  'collection item row-level security is enabled'
);

select throws_like(
  $$ insert into public.releases (created_by, artist_display, title)
     values (gen_random_uuid(), '', 'Kind of Blue') $$,
  '%violates check constraint "releases_artist_required"%',
  'blank artists are rejected'
);
select throws_like(
  $$ insert into public.collection_items (user_id, release_id, rating)
     values (gen_random_uuid(), gen_random_uuid(), 6) $$,
  '%violates check constraint "collection_items_rating_range"%',
  'ratings outside one to five are rejected'
);
select throws_like(
  $$ insert into public.collection_items (user_id, release_id, price_paid_minor)
     values (gen_random_uuid(), gen_random_uuid(), 1000) $$,
  '%violates check constraint "collection_items_price_complete"%',
  'prices require a currency'
);
select throws_like(
  $$ insert into public.collection_items (user_id, release_id, price_paid_minor, price_currency)
     values (gen_random_uuid(), gen_random_uuid(), 1000, 'usd') $$,
  '%violates check constraint "collection_items_currency_format"%',
  'currencies use uppercase three-letter codes'
);

select * from finish();
rollback;
