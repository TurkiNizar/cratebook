import type { CatalogueCoverSelection, CatalogueEntityType } from "./types";

const MUSICBRAINZ_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CatalogueAttribution = {
  label: string;
  url: string;
};

export function getCoverArtUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "coverartarchive.org" ||
        url.hostname === "www.coverartarchive.org") &&
      (url.pathname.startsWith("/release/") ||
        url.pathname.startsWith("/release-group/"))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function getCoverArtUrlForRelease(value: string, externalId: string) {
  return getCoverArtUrlForEntity(value, "release", externalId);
}

export function getCoverArtSelectionForRelease(
  coverUrlValue: string | null | undefined,
  originalUrlValue: string | null | undefined,
  externalId: string,
): CatalogueCoverSelection | null {
  const coverUrl = coverUrlValue
    ? getCoverArtUrlForRelease(coverUrlValue, externalId)
    : null;
  const originalUrl = originalUrlValue
    ? getCoverArtUrlForRelease(originalUrlValue, externalId)
    : null;

  return coverUrl && originalUrl ? { coverUrl, originalUrl } : null;
}

export function getCoverArtSelectionForEntity(
  coverUrlValue: string | null | undefined,
  originalUrlValue: string | null | undefined,
  entityType: CatalogueEntityType,
  externalId: string,
): CatalogueCoverSelection | null {
  const coverUrl = coverUrlValue
    ? getCoverArtUrlForEntity(coverUrlValue, entityType, externalId)
    : null;
  const originalUrl = originalUrlValue
    ? getCoverArtUrlForEntity(originalUrlValue, entityType, externalId)
    : null;

  return coverUrl && originalUrl ? { coverUrl, originalUrl } : null;
}

export function getCatalogueAttribution(
  source: string | null,
  entityType: string | null,
  externalId: string | null,
): CatalogueAttribution | null {
  if (
    source !== "musicbrainz" ||
    (entityType !== "release" && entityType !== "release_group") ||
    !externalId ||
    !MUSICBRAINZ_ID_PATTERN.test(externalId)
  ) {
    return null;
  }

  return {
    label: "MusicBrainz",
    url: `https://musicbrainz.org/${entityType === "release_group" ? "release-group" : "release"}/${externalId}`,
  };
}

export function getCoverArtUrlForEntity(
  value: string,
  entityType: CatalogueEntityType,
  externalId: string,
) {
  const safeUrl = getCoverArtUrl(value);
  if (!safeUrl || !MUSICBRAINZ_ID_PATTERN.test(externalId)) {
    return null;
  }

  const url = new URL(safeUrl);
  const entityPath =
    entityType === "release_group" ? "release-group" : "release";
  const prefix = `/${entityPath}/${externalId.toLocaleLowerCase("en")}/`;
  return url.pathname.toLocaleLowerCase("en").startsWith(prefix)
    ? safeUrl
    : null;
}
