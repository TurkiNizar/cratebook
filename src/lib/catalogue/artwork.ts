import "server-only";

import { musicBrainzCatalogueProvider } from "./musicbrainz";
import type {
  CatalogueAlbumProvider,
  CatalogueArtworkSearchState,
} from "./types";

const MAX_FIELD_LENGTH = 300;
const MAX_QUERY_LENGTH = 200;
const SEARCH_CANDIDATE_LIMIT = 8;
const SUGGESTION_LIMIT = 4;

function normalizeSearchPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function state(
  status: CatalogueArtworkSearchState["status"],
  message: string,
): CatalogueArtworkSearchState {
  return { status, message, suggestions: [] };
}

export async function searchAlbumArtwork(
  rawArtist: string,
  rawTitle: string,
  provider: CatalogueAlbumProvider = musicBrainzCatalogueProvider,
): Promise<CatalogueArtworkSearchState> {
  const artist = normalizeSearchPart(rawArtist);
  const title = normalizeSearchPart(rawTitle);
  const query = `${artist} ${title}`.trim();

  if (!artist || !title) {
    return state(
      "invalid_query",
      "Enter both an artist and album title before finding artwork.",
    );
  }
  if (
    artist.length > MAX_FIELD_LENGTH ||
    title.length > MAX_FIELD_LENGTH ||
    query.length > MAX_QUERY_LENGTH
  ) {
    return state(
      "invalid_query",
      "Shorten the artist or album title before finding artwork.",
    );
  }

  const result = await provider.searchAlbums(query, {
    page: 1,
    pageSize: SEARCH_CANDIDATE_LIMIT,
  });
  if (result.status === "invalid_query") {
    return state("invalid_query", result.message);
  }
  if (result.status === "no_results") {
    return state(
      "no_results",
      "No matching albums were found. You can keep this record without a cover.",
    );
  }
  if (result.status !== "success") {
    return state(
      "unavailable",
      "Artwork suggestions are unavailable right now. You can still save without a cover.",
    );
  }

  const covers = await Promise.all(
    result.candidates.map(async (candidate) => ({
      candidate,
      cover: await provider.getAlbumCover(candidate.externalId),
    })),
  );
  const suggestions = covers
    .filter(
      (
        item,
      ): item is typeof item & {
        cover: Extract<typeof item.cover, { status: "success" }>;
      } => item.cover.status === "success",
    )
    .slice(0, SUGGESTION_LIMIT)
    .map(({ candidate, cover }) => ({
      externalId: candidate.externalId,
      artist: candidate.artist,
      title: candidate.title,
      originalYear: candidate.originalYear,
      sourceUrl: candidate.sourceUrl,
      coverUrl: cover.coverUrl,
      originalUrl: cover.originalUrl,
    }));

  if (suggestions.length > 0) {
    return {
      status: "success",
      message:
        "Choose the album artwork that best matches your record, or keep no cover.",
      suggestions,
    };
  }

  const providerFailed = covers.some(
    ({ cover }) =>
      cover.status === "rate_limited" ||
      cover.status === "unavailable" ||
      cover.status === "malformed_response",
  );
  return providerFailed
    ? state(
        "unavailable",
        "Artwork suggestions are unavailable right now. You can still save without a cover.",
      )
    : state(
        "no_art",
        "Matching albums were found, but none has usable artwork. You can keep this record without a cover.",
      );
}
