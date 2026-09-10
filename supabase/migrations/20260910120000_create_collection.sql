create type public.release_format as enum (
  'lp',
  'seven_inch',
  'ten_inch',
  'twelve_inch',
  'box_set',
  'other'
);

create type public.purchase_state as enum ('new', 'used', 'unknown');

create type public.record_condition as enum (
  'mint',
  'near_mint',
  'very_good_plus',
  'very_good',
  'good_plus',
  'good',
  'fair',
  'poor'
);

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  artist_display text not null,
  title text not null,
  cover_url text,
  format public.release_format,
  disc_count smallint,
  original_year smallint,
  release_year smallint,
  label text,
  catalog_number text,
  country text,
  edition_description text,
  is_reissue boolean,
  vinyl_color text,
  barcode text,
  matrix_runout text,
  external_source text,
  external_id text,
  source_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint releases_id_created_by_unique unique (id, created_by),
  constraint releases_artist_required check (
    artist_display = btrim(artist_display)
    and char_length(artist_display) between 1 and 300
  ),
  constraint releases_title_required check (
    title = btrim(title)
    and char_length(title) between 1 and 300
  ),
  constraint releases_cover_url_length check (
    cover_url is null or char_length(cover_url) <= 2048
  ),
  constraint releases_disc_count_positive check (
    disc_count is null or disc_count between 1 and 100
  ),
  constraint releases_original_year_valid check (
    original_year is null or original_year between 1000 and 9999
  ),
  constraint releases_release_year_valid check (
    release_year is null or release_year between 1000 and 9999
  ),
  constraint releases_country_length check (
    country is null or char_length(country) <= 100
  ),
  constraint releases_external_identity_complete check (
    (external_source is null and external_id is null)
    or (external_source is not null and external_id is not null)
  )
);

comment on table public.releases is
  'Release metadata shared by a user''s collection copies and, later, wishlist items. Rows remain user-scoped until an explicit public projection is introduced.';

comment on column public.releases.source_data is
  'Original provider payload retained for catalogue provenance; never expose it through public responses.';

create index releases_created_by_created_at_idx
  on public.releases (created_by, created_at desc);

create index releases_created_by_artist_title_idx
  on public.releases (created_by, lower(artist_display), lower(title));

create unique index releases_external_identity_unique
  on public.releases (created_by, external_source, external_id)
  where external_source is not null and external_id is not null;

create trigger releases_touch_updated_at
before update on public.releases
for each row execute function public.touch_updated_at();

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  release_id uuid not null,
  entry_key uuid not null default gen_random_uuid(),
  purchase_state public.purchase_state not null default 'unknown',
  media_condition public.record_condition,
  sleeve_condition public.record_condition,
  acquired_on date,
  acquired_from text,
  price_paid_minor bigint,
  price_currency text,
  rating smallint,
  is_favorite boolean not null default false,
  notes text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint collection_items_release_owner_fk
    foreign key (release_id, user_id)
    references public.releases (id, created_by)
    on delete cascade,
  constraint collection_items_entry_key_unique unique (user_id, entry_key),
  constraint collection_items_acquired_from_length check (
    acquired_from is null or char_length(acquired_from) <= 300
  ),
  constraint collection_items_price_nonnegative check (
    price_paid_minor is null or price_paid_minor >= 0
  ),
  constraint collection_items_price_complete check (
    (price_paid_minor is null and price_currency is null)
    or (price_paid_minor is not null and price_currency is not null)
  ),
  constraint collection_items_currency_format check (
    price_currency is null or price_currency ~ '^[A-Z]{3}$'
  ),
  constraint collection_items_rating_range check (
    rating is null or rating between 1 and 5
  ),
  constraint collection_items_notes_length check (
    notes is null or char_length(notes) <= 10000
  )
);

comment on table public.collection_items is
  'One physical record copy owned by one user. Purchase and personal fields are private unless a later safe public projection explicitly includes them.';

comment on column public.collection_items.entry_key is
  'Client-supplied idempotency key used to prevent accidental duplicate submissions.';

create index collection_items_user_created_at_idx
  on public.collection_items (user_id, created_at desc);

create index collection_items_release_id_idx
  on public.collection_items (release_id);

create index collection_items_user_acquired_on_idx
  on public.collection_items (user_id, acquired_on desc)
  where acquired_on is not null;

create index collection_items_user_favorites_idx
  on public.collection_items (user_id, created_at desc)
  where is_favorite;

create trigger collection_items_touch_updated_at
before update on public.collection_items
for each row execute function public.touch_updated_at();

alter table public.releases enable row level security;
alter table public.collection_items enable row level security;

create policy releases_select_own
on public.releases
for select
using (created_by = (select auth.uid()));

create policy releases_insert_own
on public.releases
for insert
with check (created_by = (select auth.uid()));

create policy releases_update_own
on public.releases
for update
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy releases_delete_own
on public.releases
for delete
using (created_by = (select auth.uid()));

create policy collection_items_select_own
on public.collection_items
for select
using (user_id = (select auth.uid()));

create policy collection_items_insert_own
on public.collection_items
for insert
with check (user_id = (select auth.uid()));

create policy collection_items_update_own
on public.collection_items
for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy collection_items_delete_own
on public.collection_items
for delete
using (user_id = (select auth.uid()));

revoke all on table public.releases from anon, authenticated;
revoke all on table public.collection_items from anon, authenticated;

grant select, insert, update, delete on table public.releases to authenticated;
grant select, insert, update, delete on table public.collection_items to authenticated;
