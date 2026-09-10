create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  normalized_name text generated always as (
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  ) stored,
  created_at timestamptz not null default now(),

  constraint tags_id_user_id_unique unique (id, user_id),
  constraint tags_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 50
  ),
  constraint tags_normalized_name_unique unique (user_id, normalized_name)
);

comment on table public.tags is
  'Reusable, user-owned labels for organizing physical copies.';

alter table public.collection_items
  add constraint collection_items_id_user_id_unique unique (id, user_id);

create table public.collection_item_tags (
  collection_item_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (collection_item_id, tag_id),
  constraint collection_item_tags_item_owner_fk
    foreign key (collection_item_id, user_id)
    references public.collection_items (id, user_id)
    on delete cascade,
  constraint collection_item_tags_tag_owner_fk
    foreign key (tag_id, user_id)
    references public.tags (id, user_id)
    on delete cascade
);

comment on table public.collection_item_tags is
  'Owner-safe association between a physical copy and its reusable tags.';

create index collection_item_tags_user_tag_idx
  on public.collection_item_tags (user_id, tag_id);

alter table public.tags enable row level security;
alter table public.collection_item_tags enable row level security;

create policy tags_select_own
on public.tags
for select
using (user_id = (select auth.uid()));

create policy tags_insert_own
on public.tags
for insert
with check (user_id = (select auth.uid()));

create policy tags_update_own
on public.tags
for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy tags_delete_own
on public.tags
for delete
using (user_id = (select auth.uid()));

create policy collection_item_tags_select_own
on public.collection_item_tags
for select
using (user_id = (select auth.uid()));

create policy collection_item_tags_insert_own
on public.collection_item_tags
for insert
with check (user_id = (select auth.uid()));

create policy collection_item_tags_delete_own
on public.collection_item_tags
for delete
using (user_id = (select auth.uid()));

revoke all on table public.tags from anon, authenticated;
revoke all on table public.collection_item_tags from anon, authenticated;

grant select, insert, update, delete on table public.tags to authenticated;
grant select, insert, delete on table public.collection_item_tags to authenticated;

drop function public.update_collection_item_details(
  uuid,
  text,
  text,
  public.release_format,
  smallint,
  smallint,
  smallint,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text
);

create function public.update_collection_item_details(
  p_item_id uuid,
  p_artist_display text,
  p_title text,
  p_format public.release_format default null,
  p_disc_count smallint default null,
  p_original_year smallint default null,
  p_release_year smallint default null,
  p_label text default null,
  p_catalog_number text default null,
  p_country text default null,
  p_edition_description text default null,
  p_is_reissue boolean default false,
  p_vinyl_color text default null,
  p_barcode text default null,
  p_matrix_runout text default null,
  p_purchase_state public.purchase_state default 'unknown',
  p_media_condition public.record_condition default null,
  p_sleeve_condition public.record_condition default null,
  p_acquired_on date default null,
  p_acquired_from text default null,
  p_price_paid_minor bigint default null,
  p_price_currency text default null,
  p_rating smallint default null,
  p_is_favorite boolean default false,
  p_notes text default null,
  p_tags text[] default array[]::text[]
)
returns boolean
language plpgsql
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_release_id uuid;
  v_tag_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select count(
    distinct lower(btrim(regexp_replace(tag_name, '\s+', ' ', 'g')))
  )
  into v_tag_count
  from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag_name)
  where btrim(tag_name) <> '';

  if v_tag_count > 20 then
    raise exception 'A collection item can have at most 20 tags'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag_name)
    where char_length(btrim(regexp_replace(tag_name, '\s+', ' ', 'g'))) > 50
  ) then
    raise exception 'Tags must be 50 characters or fewer'
      using errcode = '22023';
  end if;

  update public.collection_items
  set
    purchase_state = p_purchase_state,
    media_condition = p_media_condition,
    sleeve_condition = p_sleeve_condition,
    acquired_on = p_acquired_on,
    acquired_from = nullif(btrim(p_acquired_from), ''),
    price_paid_minor = p_price_paid_minor,
    price_currency = nullif(upper(btrim(p_price_currency)), ''),
    rating = p_rating,
    is_favorite = p_is_favorite,
    notes = nullif(btrim(p_notes), '')
  where id = p_item_id
    and user_id = v_user_id
  returning release_id into v_release_id;

  if not found then
    return false;
  end if;

  update public.releases
  set
    artist_display = btrim(p_artist_display),
    title = btrim(p_title),
    format = p_format,
    disc_count = p_disc_count,
    original_year = p_original_year,
    release_year = p_release_year,
    label = nullif(btrim(p_label), ''),
    catalog_number = nullif(btrim(p_catalog_number), ''),
    country = nullif(btrim(p_country), ''),
    edition_description = nullif(btrim(p_edition_description), ''),
    is_reissue = p_is_reissue,
    vinyl_color = nullif(btrim(p_vinyl_color), ''),
    barcode = nullif(btrim(p_barcode), ''),
    matrix_runout = nullif(btrim(p_matrix_runout), '')
  where id = v_release_id
    and created_by = v_user_id;

  if not found then
    raise exception 'Owned release not found' using errcode = 'P0002';
  end if;

  insert into public.tags (user_id, name)
  select v_user_id, clean_name
  from (
    select distinct on (lower(clean_name)) clean_name
    from (
      select
        btrim(regexp_replace(tag_name, '\s+', ' ', 'g')) as clean_name,
        position
      from unnest(coalesce(p_tags, array[]::text[]))
        with ordinality as supplied(tag_name, position)
    ) as cleaned
    where clean_name <> ''
    order by lower(clean_name), position
  ) as unique_tags
  on conflict (user_id, normalized_name) do nothing;

  delete from public.collection_item_tags
  where collection_item_id = p_item_id
    and user_id = v_user_id;

  insert into public.collection_item_tags (collection_item_id, tag_id, user_id)
  select p_item_id, tags.id, v_user_id
  from public.tags
  where tags.user_id = v_user_id
    and tags.normalized_name in (
      select distinct lower(btrim(regexp_replace(tag_name, '\s+', ' ', 'g')))
      from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag_name)
      where btrim(tag_name) <> ''
    );

  delete from public.tags
  where tags.user_id = v_user_id
    and not exists (
      select 1
      from public.collection_item_tags
      where collection_item_tags.tag_id = tags.id
    );

  return true;
end;
$function$;

comment on function public.update_collection_item_details is
  'Atomically updates an authenticated user''s release, physical-copy details, and normalized tags.';

revoke all on function public.update_collection_item_details(
  uuid,
  text,
  text,
  public.release_format,
  smallint,
  smallint,
  smallint,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text,
  text[]
) from public, anon;

grant execute on function public.update_collection_item_details(
  uuid,
  text,
  text,
  public.release_format,
  smallint,
  smallint,
  smallint,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  public.purchase_state,
  public.record_condition,
  public.record_condition,
  date,
  text,
  bigint,
  text,
  smallint,
  boolean,
  text,
  text[]
) to authenticated;
