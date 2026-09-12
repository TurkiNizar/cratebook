begin;

select plan(8);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '74747474-7474-4747-8747-747474747474',
  'authenticated',
  'authenticated',
  'catalogue-contract@example.test',
  now(),
  now()
);

select set_config('request.jwt.claim.sub', '74747474-7474-4747-8747-747474747474', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.releases (created_by, artist_display, title)
     values (
       '74747474-7474-4747-8747-747474747474',
       'Manual Artist',
       'Manual Album'
     ) $$,
  'manual releases remain valid without catalogue provenance'
);

select lives_ok(
  $$ insert into public.releases (
       created_by,
       artist_display,
       title,
       external_source,
       external_entity_type,
       external_id,
       source_data
     ) values (
       '74747474-7474-4747-8747-747474747474',
       'Miles Davis',
       'Kind of Blue',
       'musicbrainz',
       'release_group',
       '22222222-2222-4222-8222-222222222222',
       '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"22222222-2222-4222-8222-222222222222"}}'::jsonb
     ) $$,
  'an album-level release group can be stored without exact pressing data'
);

select is(
  (
    select format
    from public.releases
    where external_entity_type = 'release_group'
  ),
  null::public.release_format,
  'album-level provenance does not infer a physical format'
);

select lives_ok(
  $$ insert into public.releases (
       created_by,
       artist_display,
       title,
       external_source,
       external_entity_type,
       external_id,
       source_data
     ) values (
       '74747474-7474-4747-8747-747474747474',
       'Miles Davis',
       'Kind of Blue exact edition',
       'musicbrainz',
       'release',
       '22222222-2222-4222-8222-222222222222',
       '{"provider":"musicbrainz","entityType":"release","release":{"id":"22222222-2222-4222-8222-222222222222"}}'::jsonb
     ) $$,
  'release-group and exact-release identities remain distinct even if their UUIDs match'
);

select is(
  (
    select count(*)
    from public.releases
    where external_id = '22222222-2222-4222-8222-222222222222'
  ),
  2::bigint,
  'the owner-scoped identity includes the provider entity type'
);

select throws_like(
  $$ insert into public.releases (
       created_by,
       artist_display,
       title,
       external_source,
       external_entity_type,
       external_id,
       source_data
     ) values (
       '74747474-7474-4747-8747-747474747474',
       'Wrong entity',
       'Wrong entity',
       'musicbrainz',
       'release_group',
       '33333333-3333-4333-8333-333333333333',
       '{"provider":"musicbrainz","entityType":"release","release":{"id":"33333333-3333-4333-8333-333333333333"}}'::jsonb
     ) $$,
  '%violates check constraint "releases_external_provenance_complete"%',
  'the schema rejects provenance whose entity type does not match the identity'
);

select throws_like(
  $$ insert into public.releases (
       created_by,
       artist_display,
       title,
       external_source,
       external_entity_type,
       external_id,
       source_data
     ) values (
       '74747474-7474-4747-8747-747474747474',
       'Wrong identifier',
       'Wrong identifier',
       'musicbrainz',
       'release_group',
       '44444444-4444-4444-8444-444444444444',
       '{"provider":"musicbrainz","entityType":"release_group","releaseGroup":{"id":"55555555-5555-4555-8555-555555555555"}}'::jsonb
     ) $$,
  '%violates check constraint "releases_external_provenance_complete"%',
  'the schema rejects provenance whose nested identifier does not match'
);

select throws_like(
  $$ insert into public.releases (
       created_by,
       artist_display,
       title,
       external_source,
       external_entity_type,
       external_id,
       source_data
     ) values (
       '74747474-7474-4747-8747-747474747474',
       'Incomplete',
       'Incomplete',
       'musicbrainz',
       'release_group',
       '66666666-6666-4666-8666-666666666666',
       null
     ) $$,
  '%violates check constraint "releases_external_identity_complete"%',
  'the schema rejects a partial catalogue identity'
);

select * from finish();
rollback;
