create type public.wishlist_priority as enum (
  'interested',
  'wanted',
  'must_have'
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  release_id uuid not null,
  priority public.wishlist_priority not null default 'interested',
  preferred_edition text,
  max_price_minor bigint,
  price_currency text,
  notes text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wishlist_items_release_owner_fk
    foreign key (release_id, user_id)
    references public.releases (id, created_by)
    on delete cascade,
  constraint wishlist_items_user_release_unique unique (user_id, release_id),
  constraint wishlist_items_preferred_edition_length check (
    preferred_edition is null or char_length(preferred_edition) <= 1000
  ),
  constraint wishlist_items_max_price_nonnegative check (
    max_price_minor is null or max_price_minor >= 0
  ),
  constraint wishlist_items_price_complete check (
    (max_price_minor is null and price_currency is null)
    or (max_price_minor is not null and price_currency is not null)
  ),
  constraint wishlist_items_currency_format check (
    price_currency is null or price_currency ~ '^[A-Z]{3}$'
  ),
  constraint wishlist_items_notes_length check (
    notes is null or char_length(notes) <= 10000
  )
);

comment on table public.wishlist_items is
  'One release wanted by one user. Target price and notes remain private unless a later safe public projection explicitly includes permitted fields.';

comment on column public.wishlist_items.max_price_minor is
  'Private target price stored in the currency''s standard minor units; never expose it through public responses.';

create index wishlist_items_user_created_at_idx
  on public.wishlist_items (user_id, created_at desc);

create index wishlist_items_user_priority_created_at_idx
  on public.wishlist_items (user_id, priority, created_at desc);

create index wishlist_items_release_id_idx
  on public.wishlist_items (release_id);

create trigger wishlist_items_touch_updated_at
before update on public.wishlist_items
for each row execute function public.touch_updated_at();

alter table public.wishlist_items enable row level security;

create policy wishlist_items_select_own
on public.wishlist_items
for select
using (user_id = (select auth.uid()));

create policy wishlist_items_insert_own
on public.wishlist_items
for insert
with check (user_id = (select auth.uid()));

create policy wishlist_items_update_own
on public.wishlist_items
for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy wishlist_items_delete_own
on public.wishlist_items
for delete
using (user_id = (select auth.uid()));

revoke all on table public.wishlist_items from anon, authenticated;

grant select, insert, update, delete on table public.wishlist_items to authenticated;
