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
      url.pathname.startsWith("/release/")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function getCoverArtUrlForRelease(value: string, externalId: string) {
  const safeUrl = getCoverArtUrl(value);
  if (!safeUrl || !MUSICBRAINZ_ID_PATTERN.test(externalId)) {
    return null;
  }

  const url = new URL(safeUrl);
  const releasePrefix = `/release/${externalId.toLocaleLowerCase("en")}/`;
  return url.pathname.toLocaleLowerCase("en").startsWith(releasePrefix)
    ? safeUrl
    : null;
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

export function getCatalogueAttribution(
  source: string | null,
  externalId: string | null,
): CatalogueAttribution | null {
  if (
    source !== "musicbrainz" ||
    !externalId ||
    !MUSICBRAINZ_ID_PATTERN.test(externalId)
  ) {
    return null;
  }

  return {
    label: "MusicBrainz",
    url: `https://musicbrainz.org/release/${externalId}`,
  };
}
import type { CatalogueCoverSelection } from "./types";
