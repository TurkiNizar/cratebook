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
