revoke select on table public.profiles from anon;

drop policy profiles_select_self_or_public on public.profiles;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

comment on policy profiles_select_self on public.profiles is
  'Profiles are read directly only by their owner. Public and owner-preview reads use the narrow get_public_* security-definer projections.';
