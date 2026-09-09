create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  display_name text,
  bio text,
  avatar_path text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format check (
    username is null
    or (
      username = lower(btrim(username))
      and username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'
    )
  ),
  constraint profiles_username_not_reserved check (
    username is null
    or username not in (
      'add', 'admin', 'api', 'auth', 'collection', 'help', 'privacy',
      'settings', 'sign-in', 'support', 'terms', 'wishlist'
    )
  ),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 80
  ),
  constraint profiles_bio_length check (
    bio is null or char_length(bio) <= 280
  ),
  constraint profiles_avatar_path_length check (
    avatar_path is null or char_length(avatar_path) <= 500
  ),
  constraint public_profile_requires_username check (
    not is_public or username is not null
  )
);

comment on table public.profiles is
  'Public-safe user profile fields. Never add email, acquisition, or other private data here.';

create unique index profiles_username_unique
  on public.profiles (username)
  where username is not null;

create index profiles_public_username_idx
  on public.profiles (username)
  where is_public;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$function$;

revoke all on function public.handle_new_auth_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

create policy profiles_select_self_or_public
on public.profiles
for select
using (
  id = (select auth.uid())
  or (is_public and username is not null)
);

create policy profiles_update_self
on public.profiles
for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke all on table public.profiles from anon, authenticated;

grant select on table public.profiles to anon, authenticated;

grant update (
  username,
  display_name,
  bio,
  avatar_path,
  is_public
) on table public.profiles to authenticated;
