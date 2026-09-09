begin;

select plan(10);

select has_table('public', 'profiles', 'profiles table exists');
select has_pk('public', 'profiles', 'profiles has a primary key');
select col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select col_not_null('public', 'profiles', 'is_public', 'visibility is never null');
select col_has_default('public', 'profiles', 'is_public', 'profiles are private by default');
select has_index('public', 'profiles', 'profiles_username_unique', 'usernames have a unique index');
select has_trigger(
  'public',
  'profiles',
  'profiles_touch_updated_at',
  'profile updates refresh updated_at'
);
select has_trigger(
  'auth',
  'users',
  'on_auth_user_created',
  'signups create profiles automatically'
);
select policies_are(
  'public',
  'profiles',
  array['profiles_select_self_or_public', 'profiles_update_self'],
  'profiles expose only the intended RLS policies'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'row-level security is enabled'
);

select * from finish();
rollback;
