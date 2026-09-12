create type public.catalogue_entity_type as enum ('release', 'release_group');

alter table public.releases
  add column external_entity_type public.catalogue_entity_type;

update public.releases
set
  external_entity_type = 'release',
  source_data = jsonb_set(
    jsonb_set(source_data, '{entityType}', '"release"'::jsonb, true),
    '{release}',
    coalesce(source_data -> 'release', '{}'::jsonb)
      || jsonb_build_object('id', external_id),
    true
  )
where external_source = 'musicbrainz';

alter table public.releases
  drop constraint releases_external_identity_complete,
  drop constraint releases_external_provenance_complete;

alter table public.releases
  add constraint releases_external_identity_complete check (
    (
      external_source is null
      and external_entity_type is null
      and external_id is null
      and source_data is null
    )
    or (
      external_source is not null
      and external_entity_type is not null
      and external_id is not null
      and source_data is not null
    )
  ),
  add constraint releases_external_provenance_complete check (
    external_source is null
    or (
      external_source = 'musicbrainz'
      and external_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and jsonb_typeof(source_data) = 'object'
      and source_data ->> 'provider' = external_source
      and source_data ->> 'entityType' = external_entity_type::text
      and (
        (
          external_entity_type = 'release'
          and source_data #>> '{release,id}' = external_id
        )
        or (
          external_entity_type = 'release_group'
          and source_data #>> '{releaseGroup,id}' = external_id
        )
      )
      and octet_length(source_data::text) <= 32768
    )
  );

comment on column public.releases.external_entity_type is
  'Provider entity identified by external_id. release means an exact MusicBrainz edition; release_group means album-level identity only and must not imply an exact pressing.';

comment on column public.releases.source_data is
  'Bounded private provider snapshot. provider, entityType, and the matching entity ID are required for catalogue provenance; never expose it through public responses.';

drop index public.releases_external_identity_unique;

create unique index releases_external_identity_unique
  on public.releases (
    created_by,
    external_source,
    external_entity_type,
    external_id
  )
  where external_source is not null
    and external_entity_type is not null
    and external_id is not null;

create function public.set_catalogue_entity_type()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.external_source is null then
    new.external_entity_type := null;
    return new;
  end if;

  if new.external_entity_type is null then
    if new.source_data ->> 'entityType' = 'release_group' then
      new.external_entity_type := 'release_group';
    else
      new.external_entity_type := 'release';
      new.source_data := jsonb_set(
        new.source_data,
        '{entityType}',
        '"release"'::jsonb,
        true
      );
      if new.source_data #>> '{release,id}' is null then
        new.source_data := jsonb_set(
          new.source_data,
          '{release}',
          coalesce(new.source_data -> 'release', '{}'::jsonb)
            || jsonb_build_object('id', new.external_id),
          true
        );
      end if;
    end if;
  end if;

  return new;
end;
$function$;

comment on function public.set_catalogue_entity_type is
  'Keeps existing exact-release RPC callers compatible while deriving the explicit MusicBrainz entity type from verified provenance.';

revoke all on function public.set_catalogue_entity_type() from public, anon, authenticated;

create trigger releases_set_catalogue_entity_type
before insert or update of external_source, external_entity_type, external_id, source_data
on public.releases
for each row execute function public.set_catalogue_entity_type();
